<a name="slonik"></a>
# Slonik

[![Travis build status](http://img.shields.io/travis/gajus/slonik/master.svg?style=flat-square)](https://travis-ci.org/gajus/slonik)
[![Coveralls](https://img.shields.io/coveralls/gajus/slonik.svg?style=flat-square)](https://coveralls.io/github/gajus/slonik)
[![NPM version](http://img.shields.io/npm/v/slonik.svg?style=flat-square)](https://www.npmjs.org/package/slonik)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A PostgreSQL client with strict types, detail logging and assertions.

<a name="slonik-features"></a>
## Features

* [Convenience methods](#slonik-query-methods) with built-in assertions
* Anonymous, named and tagged template literal [value placeholders](#slonik-value-placeholders)
* [Middleware](#slonik-interceptors) support
* [Syntax highlighting](#slonik-syntax-highlighting) (Atom plugin compatible with Slonik)
* [SQL injection guarding](https://github.com/gajus/eslint-plugin-sql) (ESLint plugin compatible with Slonik)
* Detail [logging](#slonik-debugging)
* Built-in [asynchronous stack trace resolution](#log-stack-trace)
* [Flow types](#types)
* [Mapped errors](#error-handling)
* [Transactions](#transactions)

---

<a name="slonik-documentation"></a>
## Documentation

* [Slonik](#slonik)
    * [Features](#slonik-features)
    * [Documentation](#slonik-documentation)
    * [Usage](#slonik-usage)
        * [Configuration](#slonik-usage-configuration)
    * [Interceptors](#slonik-interceptors)
        * [`beforeQuery`](#slonik-interceptors-beforequery)
        * [`afterQuery`](#slonik-interceptors-afterquery)
    * [Non-standard behaviour](#slonik-non-standard-behaviour)
    * [Conventions](#slonik-conventions)
        * [No multiline values](#slonik-conventions-no-multiline-values)
    * [Value placeholders](#slonik-value-placeholders)
        * [Anonymous placeholders](#slonik-value-placeholders-anonymous-placeholders)
        * [A value set](#slonik-value-placeholders-a-value-set)
        * [Multiple value sets](#slonik-value-placeholders-multiple-value-sets)
        * [Named placeholders](#slonik-value-placeholders-named-placeholders)
        * [Tagged template literals](#slonik-value-placeholders-tagged-template-literals)
    * [Query methods](#slonik-query-methods)
        * [`any`](#slonik-query-methods-any)
        * [`anyFirst`](#slonik-query-methods-anyfirst)
        * [`insert`](#slonik-query-methods-insert)
        * [`many`](#slonik-query-methods-many)
        * [`manyFirst`](#slonik-query-methods-manyfirst)
        * [`maybeOne`](#slonik-query-methods-maybeone)
        * [`maybeOneFirst`](#slonik-query-methods-maybeonefirst)
        * [`one`](#slonik-query-methods-one)
        * [`oneFirst`](#slonik-query-methods-onefirst)
        * [`query`](#slonik-query-methods-query)
        * [`transaction`](#slonik-query-methods-transaction)
    * [Error handling](#slonik-error-handling)
        * [Handling `NotFoundError`](#slonik-error-handling-handling-notfounderror)
        * [Handling `DataIntegrityError`](#slonik-error-handling-handling-dataintegrityerror)
        * [Handling `NotNullIntegrityConstraintViolationError`](#slonik-error-handling-handling-notnullintegrityconstraintviolationerror)
        * [Handling `ForeignKeyIntegrityConstraintViolationError`](#slonik-error-handling-handling-foreignkeyintegrityconstraintviolationerror)
        * [Handling `UniqueIntegrityConstraintViolationError`](#slonik-error-handling-handling-uniqueintegrityconstraintviolationerror)
        * [Handling `CheckIntegrityConstraintViolationError`](#slonik-error-handling-handling-checkintegrityconstraintviolationerror)
    * [Types](#slonik-types)
    * [Debugging](#slonik-debugging)
        * [Logging](#slonik-debugging-logging)
        * [Log stack trace](#slonik-debugging-log-stack-trace)
    * [Syntax highlighting](#slonik-syntax-highlighting)
        * [Atom](#slonik-syntax-highlighting-atom)


<a name="slonik-usage"></a>
## Usage

Slonik exports two factory functions:

* `createPool`
* `createConnection`

The API of the query method is equivalent to that of [`pg`](https://travis-ci.org/brianc/node-postgres).

Refer to [query methods](#slonik-query-methods) for documentation of Slonik-specific query methods.

<a name="slonik-usage-configuration"></a>
### Configuration

Both functions accept the same parameters:

* `connectionConfiguration`
* `clientConfiguration`

```js
type DatabaseConnectionUriType = string;

type DatabaseConfigurationType =
  DatabaseConnectionUriType |
  {|
    +database?: string,
    +host?: string,
    +idleTimeoutMillis?: number,
    +max?: number,
    +password?: string,
    +port?: number,
    +user?: string
  |};

type ClientConfigurationType = {|
  +interceptors?: $ReadOnlyArray<InterceptorType>
|};

```

Example:

```js
import {
  createPool
} from 'slonik';

const connection = createPool('postgres://localhost');

await connection.query(sql`SELECT 1`);

```


<a name="slonik-interceptors"></a>
## Interceptors

Functionality can be added to Slonik client by adding interceptors.

Each interceptor can implement several functions which can be used to change the behaviour of the database client.

```js
type InterceptorType = {|
  +beforeQuery?: (query: QueryType) => Promise<QueryResultType<QueryResultRowType>> | Promise<void> | QueryResultType<QueryResultRowType> | void,
  +afterQuery?: (query: QueryType, result: QueryResultType<QueryResultRowType>) => Promise<void> | void
|};

```

Interceptors are configured using [client configuration](#slonik-usage-configuration), e.g.

```js
import {
  createPool
} from 'slonik';

const interceptors = [];

const connection = createPool('postgres://', {
  interceptors
});

```

There are 2 functions that an interceptor can implement:

* beforeQuery
* afterQuery

Interceptors are executed in the order they are added.

<a name="slonik-interceptors-beforequery"></a>
### <code>beforeQuery</code>

`beforeQuery` is the first interceptor function executed.

This function can optionally return a direct result of the query which will cause the actual query never to be executed.

<a name="slonik-interceptors-afterquery"></a>
### <code>afterQuery</code>

`afterQuery` is the last interceptor function executed.


<a name="slonik-non-standard-behaviour"></a>
## Non-standard behaviour

* `timestamp` and `timestamp with time zone` returns UNIX timestamp in milliseconds.

<a name="slonik-conventions"></a>
## Conventions

<a name="slonik-conventions-no-multiline-values"></a>
### No multiline values

Slonik will strip all comments and line-breaks from a query before processing it.

This makes logging of the queries easier.

The implication is that your query cannot contain values that include a newline character, e.g.

```sql
// Do not do this
connection.query(sql`INSERT INTO foo (bar) VALUES ('\n')`);

```

If you want to communicate a value that includes a multiline character, use value placeholder interpolation, e.g.

```sql
connection.query(sql`INSERT INTO foo (bar) VALUES (${'\n'})`);

```

<a name="slonik-value-placeholders"></a>
## Value placeholders

<a name="slonik-value-placeholders-anonymous-placeholders"></a>
### Anonymous placeholders

Slonik enables use of question mark (`?`) value placeholders, e.g.

```js
await connection.query('SELECT ?', [
  1
]);

```

Question mark value placeholders are converted to positional value placeholders before they are passed to the `pg` driver, i.e. the above query becomes:

```sql
SELECT $1
```

Note: Mixing anonymous and position placeholders in a single query will result in an error.

<a name="slonik-value-placeholders-a-value-set"></a>
### A value set

A question mark is interpolated into a value set when the associated value is an array, e.g.

```js
await connection.query('SELECT ?', [
  [
    1,
    2,
    3
  ]
]);

```

Produces:

```sql
SELECT ($1, $2, $3)

```

<a name="slonik-value-placeholders-multiple-value-sets"></a>
### Multiple value sets

A question mark is interpolated into a list of value sets when the associated value is an array of arrays, e.g.

```js
await connection.query('SELECT ?', [
  [
    [
      1,
      2,
      3
    ],
    [
      1,
      2,
      3
    ]
  ]
]);

```

Produces:

```sql
SELECT ($1, $2, $3), ($4, $5, $6)

```

<a name="slonik-value-placeholders-named-placeholders"></a>
### Named placeholders

A `:[a-zA-Z]` regex is used to match named placeholders.

```js
await connection.query('SELECT :foo', {
  foo: 'FOO'
});

```

Produces:

```sql
SELECT $1

```

<a name="slonik-value-placeholders-tagged-template-literals"></a>
### Tagged template literals

Query methods can be executed using `sql` [tagged template literal](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals), e.g.

```js
import {
  sql
} from 'slonik'

connection.query(sql`
  INSERT INTO reservation_ticket (reservation_id, ticket_id)
  VALUES ${values}
`);

```

Arguments of a tagged template literal invocation are replaced with an anonymous value placeholder, i.e. the latter query is equivalent to:

```js
connection.query(sql`
  INSERT INTO reservation_ticket (reservation_id, ticket_id)
  VALUES ?
`, [
  values
]);

```

<a name="slonik-value-placeholders-tagged-template-literals-creating-dynamic-delimited-identifiers"></a>
#### Creating dynamic delimited identifiers

[Delimited identifiers](https://www.postgresql.org/docs/current/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS) are created by enclosing an arbitrary sequence of characters in double-quotes ("). To create create a delimited identifier, create an `sql` tag function placeholder value using `sql.identifier`, e.g.

```js
sql`
  SELECT ${'foo'}
  FROM ${sql.identifier(['bar', 'baz'])
}`;

// {
//   sql: 'SELECT ? FROM "bar"."baz"',
//   values: [
//     'foo'
//   ]
// }

```

<a name="slonik-value-placeholders-tagged-template-literals-guarding-against-accidental-unescaped-input"></a>
#### Guarding against accidental unescaped input

When using tagged template literals, it is easy to forget to add the `sql` tag, i.e.

Instead of:

```js
connection.query(sql`
  INSERT INTO reservation_ticket (reservation_id, ticket_id)
  VALUES ${values}
`);

```

Writing

```js
connection.query(`
  INSERT INTO reservation_ticket (reservation_id, ticket_id)
  VALUES ${values}
`);

```

This would expose your application to [SQL injection](https://en.wikipedia.org/wiki/SQL_injection).

Therefore, I recommend using [`eslint-plugin-sql`](https://github.com/gajus/eslint-plugin-sql) `no-unsafe-query` rule. `no-unsafe-query` warns about use of SQL inside of template literals without the `sql` tag.


<a name="slonik-query-methods"></a>
## Query methods

<a name="slonik-query-methods-any"></a>
### <code>any</code>

Returns result rows.

Example:

```js
const rows = await connection.any(sql`SELECT foo`);

```

`#any` is similar to `#query` except that it returns rows without fields information.

<a name="slonik-query-methods-anyfirst"></a>
### <code>anyFirst</code>

Returns value of the first column of every row in the result set.

* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const fooValues = await connection.anyFirst(sql`SELECT foo`);

```

<a name="slonik-query-methods-insert"></a>
### <code>insert</code>

Used when inserting 1 row.

Example:

```js
const {
  insertId
} = await connection.insert(sql`INSERT INTO foo SET bar='baz'`);

```

The reason for using this method over `#query` is to leverage the strict types. `#insert` method result type is `InsertResultType`.

<a name="slonik-query-methods-many"></a>
### <code>many</code>

Returns result rows.

* Throws `NotFoundError` if query returns no rows.

Example:

```js
const rows = await connection.many(sql`SELECT foo`);

```

<a name="slonik-query-methods-manyfirst"></a>
### <code>manyFirst</code>

Returns value of the first column of every row in the result set.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const fooValues = await connection.many(sql`SELECT foo`);

```

<a name="slonik-query-methods-maybeone"></a>
### <code>maybeOne</code>

Selects the first row from the result.

* Returns `null` if row is not found.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const row = await connection.maybeOne(sql`SELECT foo`);

// row.foo is the result of the `foo` column value of the first row.

```

<a name="slonik-query-methods-maybeonefirst"></a>
### <code>maybeOneFirst</code>

Returns value of the first column from the first row.

* Returns `null` if row is not found.
* Throws `DataIntegrityError` if query returns multiple rows.
* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```js
const foo = await connection.maybeOneFirst(sql`SELECT foo`);

// foo is the result of the `foo` column value of the first row.

```

<a name="slonik-query-methods-one"></a>
### <code>one</code>

Selects the first row from the result.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const row = await connection.one(sql`SELECT foo`);

// row.foo is the result of the `foo` column value of the first row.

```

> Note:
>
> I've been asked "What makes this different from [knex.js](http://knexjs.org/) `knex('foo').limit(1)`?".
> `knex('foo').limit(1)` simply generates "SELECT * FROM foo LIMIT 1" query.
> `knex` is a query builder; it does not assert the value of the result.
> Slonik `#one` adds assertions about the result of the query.

<a name="slonik-query-methods-onefirst"></a>
### <code>oneFirst</code>

Returns value of the first column from the first row.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple rows.
* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```js
const foo = await connection.oneFirst(sql`SELECT foo`);

// foo is the result of the `foo` column value of the first row.

```

<a name="slonik-query-methods-query"></a>
### <code>query</code>

API and the result shape are equivalent to [`pg#query`](https://github.com/brianc/node-postgres).

<a name="slonik-query-methods-transaction"></a>
### <code>transaction</code>

`transaction` method is used wrap execution of queries in `START TRANSACTION` and `COMMIT` or `ROLLBACK`. `COMMIT` is called if the transaction handler returns a promise that resolves; `ROLLBACK` is called otherwise.

`transaction` method can be used together with `createPool` method. When used to create a transaction from an instance of a pool, a new connection is allocated for the duration of the transaction.

```js
const result = await connection.transaction(async (transactionConnection) => {
  await transactionConnection.query(sql`INSERT INTO foo (bar) VALUES ('baz')`);
  await transactionConnection.query(sql`INSERT INTO qux (quux) VALUES ('quuz')`);

  return 'FOO';
});

result === 'FOO';

```


<a name="slonik-error-handling"></a>
## Error handling

All Slonik errors extend from `SlonikError`, i.e. You can catch Slonik specific errors using the following logic.

```js
import {
  SlonikError
} from 'slonik';

try {
  await query();
} catch (error) {
  if (error instanceof SlonikError) {
    // This error is thrown by Slonik.
  }
}

```

<a name="slonik-error-handling-handling-notfounderror"></a>
### Handling <code>NotFoundError</code>

To handle the case where query returns less than one row, catch `NotFoundError` error.

```js
import {
  NotFoundError
} from 'slonik';

let row;

try {
  row = await connection.one(sql`SELECT foo`);
} catch (error) {
  if (!(error instanceof NotFoundError)) {
    throw error;
  }
}

if (row) {
  // row.foo is the result of the `foo` column value of the first row.
}

```

<a name="slonik-error-handling-handling-dataintegrityerror"></a>
### Handling <code>DataIntegrityError</code>

To handle the case where the data result does not match the expectations, catch `DataIntegrityError` error.

```js
import {
  NotFoundError
} from 'slonik';

let row;

try {
  row = await connection.one(sql`SELECT foo`);
} catch (error) {
  if (error instanceof DataIntegrityError) {
    console.error('There is more than one row matching the select criteria.');
  } else {
    throw error;
  }
}

```

<a name="slonik-error-handling-handling-notnullintegrityconstraintviolationerror"></a>
### Handling <code>NotNullIntegrityConstraintViolationError</code>

`NotNullIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23502`) error.

<a name="slonik-error-handling-handling-foreignkeyintegrityconstraintviolationerror"></a>
### Handling <code>ForeignKeyIntegrityConstraintViolationError</code>

`ForeignKeyIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23503`) error.

<a name="slonik-error-handling-handling-uniqueintegrityconstraintviolationerror"></a>
### Handling <code>UniqueIntegrityConstraintViolationError</code>

`UniqueIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23505`) error.

<a name="slonik-error-handling-handling-checkintegrityconstraintviolationerror"></a>
### Handling <code>CheckIntegrityConstraintViolationError</code>

`CheckIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23514`) error.

<a name="slonik-types"></a>
## Types

This package is using [Flow](https://flow.org/) types.

Refer to [`./src/types.js`](./src/types.js).

The public interface exports the following types:

* `DatabaseConnectionType`
* `DatabasePoolConnectionType`
* `DatabaseSingleConnectionType`

Use these types to annotate `connection` instance in your code base, e.g.

```js
// @flow

import type {
  DatabaseConnectionType
} from 'slonik';

export default async (
  connection: DatabaseConnectionType,
  code: string
): Promise<number> => {
  const countryId = await connection.oneFirst(sql`
    SELECT id
    FROM country
    WHERE code = ${code}
  `);

  return countryId;
};

```


<a name="slonik-debugging"></a>
## Debugging

<a name="slonik-debugging-logging"></a>
### Logging

Slonik uses [roarr](https://github.com/gajus/roarr) to log queries.

To enable logging, define `ROARR_LOG=true` environment variable.

By default, Slonik logs the input query, query execution time and affected row count.

You can enable additional logging details by configuring the following environment variables.

```bash
# Logs query parameter values
export SLONIK_LOG_VALUES=true

# Logs normalised query and input values
export SLONIK_LOG_NORMALISED=true

```

<a name="slonik-debugging-log-stack-trace"></a>
### Log stack trace

`SLONIK_LOG_STACK_TRACE=1` will create a stack trace before invoking the query and include the stack trace in the logs, e.g.

```json
{"context":{"package":"slonik","namespace":"slonik","logLevel":20,"executionTime":"357 ms","queryId":"01CV2V5S4H57KCYFFBS0BJ8K7E","rowCount":1,"sql":"SELECT schedule_cinema_data_task();","stackTrace":["/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist:162:28","/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist:314:12","/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist:361:20","/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist/utilities:17:13","/Users/gajus/Documents/dev/applaudience/data-management-program/src/bin/commands/do-cinema-data-tasks.js:59:21","/Users/gajus/Documents/dev/applaudience/data-management-program/src/bin/commands/do-cinema-data-tasks.js:590:45","internal/process/next_tick.js:68:7"],"values":[]},"message":"query","sequence":4,"time":1540915127833,"version":"1.0.0"}
{"context":{"package":"slonik","namespace":"slonik","logLevel":20,"executionTime":"66 ms","queryId":"01CV2V5SGS0WHJX4GJN09Z3MTB","rowCount":1,"sql":"SELECT cinema_id \"cinemaId\", target_data \"targetData\" FROM cinema_data_task WHERE id = ?","stackTrace":["/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist:162:28","/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist:285:12","/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist/utilities:17:13","/Users/gajus/Documents/dev/applaudience/data-management-program/src/bin/commands/do-cinema-data-tasks.js:603:26","internal/process/next_tick.js:68:7"],"values":[17953947]},"message":"query","sequence":5,"time":1540915127902,"version":"1.0.0"}

```

Use [`@roarr/cli`](https://github.com/gajus/roarr-cli) to pretty-print the output.

![Log Roarr pretty-print output.](./.README/log-roarr-pretty-print-output.png)


<a name="slonik-syntax-highlighting"></a>
## Syntax highlighting

<a name="slonik-syntax-highlighting-atom"></a>
### Atom

Using [Atom](https://atom.io/) IDE you can leverage the [`language-babel`](https://github.com/gandm/language-babel) package in combination with the [`language-sql`](https://github.com/atom/language-sql) to enable highlighting of the SQL strings in the codebase.

![Syntax highlighting in Atom](./.README/atom-syntax-highlighting.png)

To enable highlighting, you need to:

1. Install `language-babel` and `language-sql` packages.
1. Configure `language-babel` "JavaScript Tagged Template Literal Grammar Extensions" setting to use `language-sql` to highlight template literals with `sql` tag (configuration value: `sql:source.sql`).
1. Use [`sql` helper to construct the queries](https://github.com/gajus/slonik#tagged-template-literals).

For more information, refer to the [JavaScript Tagged Template Literal Grammar Extensions](https://github.com/gandm/language-babel#javascript-tagged-template-literal-grammar-extensions) documentation of `language-babel` package.
