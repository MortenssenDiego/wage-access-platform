import { MongoClient, ObjectId, WithId } from "mongodb";
import { ICurrency, ICurrencyWithId, IMDBCurrency, ZCurrency, ZCurrencyPublic } from "~/types/currency";
import { IEmployee, IEmployeeWithId, IMDBEmployee, ZEmployeePublic } from "~/types/employee";
import { IMDBTransaction, ITransaction } from "~/types/transactions";

let client: MongoClient | null = null;
export const getMongoClient = async () => {
    if (client != null) return client;
    try {
        client = await MongoClient.connect(process.env.MONGODB_URL!);
        return client;
    } catch(err) {
        console.log(`getMongoClient error : ${err}`);
        return null;
    }
}

// Currencies

export const createCurrency = async (currency: ICurrency) => {
    try {
        const client = await getMongoClient();
        if(!client) return null;
        const collection = client.db('wage').collection<IMDBCurrency>('currencies');

        const id = new ObjectId();
        const result = await collection.updateOne(
            {
                name: currency.name,
            },
            {
                $setOnInsert: {
                    ...currency,
                    _id: id,
                    createdAt: new Date(),
                },
            },
            {
                upsert: true,
            }
        );

        return result.upsertedCount > 0 ? id : null;
    } catch (error) {
        return null;
    }
}

export const getCurrency = async (id: ObjectId) => {
    try {
        const client = await getMongoClient();
        if(!client) return null;
        const collection = client.db('wage').collection<IMDBCurrency>('currencies');

        const result = await collection.findOne({
            _id: id,
        })

        return result;
    } catch (error) {
        return null;
    }
}

export const getCurrencies = async () => {
    try {
        const client = await getMongoClient();
        if(!client) return null;
        const collection = client.db('wage').collection<IMDBCurrency>('currencies');
        
        return (await collection.find().toArray()).map<ICurrencyWithId>(({_id, ...e}) => ZCurrencyPublic.parse(({...e, id: _id.toHexString()})));
    } catch (error) {
        return null;
    }
}

export const changeAccountCurrencyByEmployeeID = async (currency_id: ObjectId, employeeId: ObjectId) => {
    try {
        const client = await getMongoClient();
        if(!client) return null;
        const currenciesCollection = client.db('wage').collection<IMDBCurrency>('currencies');
        const employeesCollection = client.db('wage').collection<IMDBEmployee>('employees');

        const targetCurrency = await currenciesCollection.findOne(
            {
                currency_id,
            }
        );

        const employee = await getEmployee(employeeId);
        const originalCurrency = await getCurrency(employee!.currency_id);

        const result = await employeesCollection.updateOne(
            {
                _id: employee!._id,
            },
            {
                $set: {
                    currency_id: targetCurrency!._id,
                    total_earned: (employee!.total_earned * originalCurrency!.conversion_rate) * (1 / targetCurrency!.conversion_rate),
                    available_withdrawal: (employee!.available_withdrawal * originalCurrency!.conversion_rate) * (1 / targetCurrency!.conversion_rate),
                },
            }
        );

        return result.modifiedCount > 0 ? employee : null;
    } catch (error) {
        return null;
    }
}

// Employees

export const createEmployee = async (employee: IEmployee) => {
    try {
        const client = await getMongoClient();
        if(!client) return null;
        const collection = client.db('wage').collection<IMDBEmployee>('employees');

        const id = new ObjectId();
        const result = await collection.updateOne(
            {
                employee_id: employee.employee_id,
            },
            {
                $setOnInsert: {
                    ...employee,
                    available_withdrawal: employee.total_earned,
                    currency_id: new ObjectId(employee.currency_id),
                    _id: id,
                    createdAt: new Date(),
                },
            },
            {
                upsert: true,
            }
        );

        return result.upsertedCount > 0 ? id : null;
    } catch (error) {
        return null;
    }
}

export const getEmployee = async (id: ObjectId) => {
    try {
        const client = await getMongoClient();
        if(!client) return null;
        const collection = client.db('wage').collection<IMDBEmployee>('employees');

        const result = await collection.findOne(
            {
                _id: new ObjectId(id),
            }
        );

        return result;
    } catch (error) {
        return null;
    }
}

// Wages

export const processWithdrawal = async (employeeOid: ObjectId, request: ITransaction) => {
    const client = await getMongoClient();
    if(!client) return null;
	
    const employee = await getEmployee(employeeOid);
    if (employee == null || employee.available_withdrawal < request.amount) { return null; }
	
    const session = client.startSession();
    session.startTransaction();
	
    try {
        const currenciesCollection = client.db('wage').collection<IMDBCurrency>('currencies');
        const employeesCollection = client.db('wage').collection<IMDBEmployee>('employees');
        const transactionsCollection = client.db('wage').collection<IMDBTransaction>('transactions');

        let targetCurrencyId: ObjectId | null = null;
		
		let convertedAmount = request.amount;
		if (employee.currency_id.equals(request.currency_id) == false) {
			const sourceCurrency = await currenciesCollection.findOne(
				{
					_id: new ObjectId(request.currency_id),
				},
				{
					session,
				}
			);

            if (sourceCurrency == null) {
                await session.abortTransaction();
                return null;
            }
			
			const targetCurrency = await currenciesCollection.findOne(
				{
					_id: new ObjectId(employee.currency_id),
				},
				{
					session,
				}
			);

            if (targetCurrency == null) {
                await session.abortTransaction();
                return null;
            }

			convertedAmount = (request.amount * sourceCurrency.conversion_rate) * (1.0 / targetCurrency.conversion_rate);
            targetCurrencyId = targetCurrency._id;
		}
		
        const transactionUpdateResults = await transactionsCollection.updateOne(
            {
                transaction_id: new ObjectId(request.transaction_id),
                employee_id: new ObjectId(employee._id),
            },
            {
                $setOnInsert: {
                    _id: new ObjectId(),
                    transaction_id: new ObjectId(request.transaction_id),
                    employee_id: new ObjectId(employee._id),
                    source_currency_id: new ObjectId(request.currency_id),
                    source_amount: request.amount.toFixed(2),
					target_currency_id: new ObjectId(employee.currency_id),
					amount: +convertedAmount.toFixed(2),
                    status: 'pending',
                    createdAt: new Date(),
                },
            },
            {
                upsert: true,
                session,
            }
        );
		if (transactionUpdateResults.upsertedCount == 0) {
			const transaction = await transactionsCollection.findOne(
				{
					transaction_id: new ObjectId(request.transaction_id),
					employee_id: new ObjectId(employee._id),
				},
				{
					session,
				}
			);

			await session.commitTransaction();
			return {
				id: transaction!._id,
				status: transaction!.status,
			};
		}
		
        const employeeUpdateResults = await employeesCollection.updateOne(
            {
                _id: new ObjectId(employee._id),
                available_withdrawal: { $gte: convertedAmount },
                currency_id: targetCurrencyId ? new ObjectId(targetCurrencyId) : employee.currency_id,
            },
            {
                $inc: {
                    total_earned: +convertedAmount.toFixed(2),
                    available_withdrawal: -(+convertedAmount.toFixed(2)),
                }
            },
            {
                session,
            }
        );
		
		const transactionStatus = employeeUpdateResults.modifiedCount > 0 ? 'success' : 'failed';
		await transactionsCollection.updateOne(
			{
				_id: new ObjectId(transactionUpdateResults.upsertedId!),
			},
			{
				$set: {
					status: employeeUpdateResults.modifiedCount > 0 ? 'success' : 'failed',
				},
			},
			{
				upsert: true,
				session,
			}
		);

        await session.commitTransaction();

        return (
			transactionUpdateResults.upsertedCount > 0
			? {
				id: transactionUpdateResults.upsertedId,
				status: transactionStatus,
			}
			: {error: "No withdraw balance available."}
		);
    } catch (error) {
        await session.abortTransaction();
        return null;
    } finally {
        await session.endSession();
    }
}

export const findEmployeeTransactions = async (employeeId: ObjectId) => {
    try {
        const client = await getMongoClient();
        if(!client) return null;
        const collection = client.db('wage').collection<IMDBTransaction>('transactions');

        const result = await collection.find(
            {
                employee_id: new ObjectId(employeeId),
            }
        ).toArray();

        return result;
    } catch (error) {
        return null;
    }
}

export const getEmployees = async () => {
    try {
        const client = await getMongoClient();
        if(!client) return null;
        const collection = client.db('wage').collection<IMDBEmployee>('employees');

        return (await collection.find().toArray()).map<IEmployeeWithId>(({_id, ...e}) => ZEmployeePublic.parse(({...e, id: _id.toHexString()})));
    } catch (error) {
        return null;
    }
}