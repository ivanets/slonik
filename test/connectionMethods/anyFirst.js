// @flow

/* eslint-disable flowtype/no-weak-types */

import test from 'ava';
import sinon from 'sinon';
import log from '../helpers/Logger';
import anyFirst from '../../src/connectionMethods/anyFirst';
import {
  DataIntegrityError
} from '../../src/errors';

test('returns values of the query result rows', async (t) => {
  const stub = sinon.stub().returns({
    rows: [
      {
        foo: 1
      },
      {
        foo: 2
      }
    ]
  });

  const connection: any = {
    query: stub
  };

  const result = await anyFirst(log, connection, {}, '');

  t.deepEqual(result, [
    1,
    2
  ]);
});

test('throws an error if more than one column is returned', async (t) => {
  const stub = sinon.stub().returns({
    rows: [
      {
        bar: 1,
        foo: 1
      }
    ]
  });

  const connection: any = {
    query: stub
  };

  await t.throwsAsync(anyFirst(log, connection, {}, ''), DataIntegrityError);
});
