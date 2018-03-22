var verify = function (msg, fn) {
  if (fn()) {
    console.log('OK: ', msg);
  } else {
    console.error('ERROR: ', msg);
  }
};

function testVectorAdd() {
  var v1 = new Vector(1, 2);
  var v2 = new Vector(3, -3);

  var v3 = v1.add(v2);

  verify(
    "Vector.add should return (4, -1) for (1, 2) and (3, -3)",
    v3.x === 4 && v3.y === -1
  );
}

function testVectorMult() {
}
