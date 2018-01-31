/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

let thrift = require("thrift");
let Calculator = require("./gen-nodejs/Calculator");
let ttypes = require("./gen-nodejs/tutorial_types");
let SharedStruct = require("./gen-nodejs/shared_types").SharedStruct;

let data = {};

let server = thrift.createServer(Calculator, {
  ping: function(result) {
    // console.log("ping()");
    result();
  },

  add: function(n1, n2, result) {
    console.log("add(", n1, ",", n2, ")");
    result(null, n1 + n2);
  },

  calculate: function(logid, work, result) {
    console.log("calculate(", logid, ",", work, ")");

    let val = 0;
    if (work.op == ttypes.Operation.ADD) {
      val = work.num1 + work.num2;
    } else if (work.op === ttypes.Operation.SUBTRACT) {
      val = work.num1 - work.num2;
    } else if (work.op === ttypes.Operation.MULTIPLY) {
      val = work.num1 * work.num2;
    } else if (work.op === ttypes.Operation.DIVIDE) {
      if (work.num2 === 0) {
        let x = new ttypes.InvalidOperation();
        x.whatOp = work.op;
        x.why = 'Cannot divide by 0';
        result(x);
        return;
      }
      val = work.num1 / work.num2;
    } else {
      let x = new ttypes.InvalidOperation();
      x.whatOp = work.op;
      x.why = 'Invalid operation';
      result(x);
      return;
    }

    let entry = new SharedStruct();
    entry.key = logid;
    entry.value = ""+val;
    data[logid] = entry;

    result(null, val);
  },

  getStruct: function(key, result) {
    console.log("getStruct(", key, ")");
    result(null, data[key]);
  },

  zip: function() {
    console.log("zip()");
    result(null);
  }

});

server.listen(9090);
