# MongoDB Compass

InvoiceFlow already uses MongoDB through the server connection string in `server/.env`.

Default local connection:

```text
mongodb://localhost:27017/invoiceflow
```

## Use the same database in the app and Compass

1. Make sure MongoDB is running locally.
2. In `server/.env`, set `MONGO_URI` to the database you want InvoiceFlow to use.
3. Open MongoDB Compass.
4. Paste the same `MONGO_URI` into Compass and connect.
5. Open the `invoiceflow` database to inspect collections such as:
   - `businessprofiles`
   - `clients`
   - `invoices`
   - `payments`
   - `invoicecounters`

To load local mock records into that same database:

```text
npm run seed:mock
```

## Current local development setup

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/invoiceflow
NODE_ENV=development
```

If you change `MONGO_URI`, restart the server so the app reconnects to the new database.
