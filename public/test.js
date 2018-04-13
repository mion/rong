lg("Loading script: test.js");

const assert = console.assert;

function test(msg, undef) {
  if (typeof undex === 'undefined') {
    lg('s', msg);
  } else {
    lg('e', msg);
  }
}

function testVector() {
  testVectorAdd();
  testVectorDistance();
  testVectorSize();
  testVectorUnit();
  testVectorRotateTo();
  testVectorRotateBy();
}

function testVectorAdd() {
  var v1 = new Vector(1, 2);
  var v2 = new Vector(3, -3);

  var v3 = v1.add(v2);

  test("Vector.add should return (4, -1) for (1, 2) and (3, -3)",
    assert(v3.x === 4 && v3.y === -1)
  );
}

function testVectorDistance() {
  var v1 = new Vector(0, 0);
  var v2 = new Vector(0, 3);

  var dist = v1.distance(v2);

  test("Vector.distance between (0, 0) and (0, 3) should be 3",
    assert(dist === 3)
  );
}

function testVectorSize() {

}

function testVectorUnit() {

}

function testVectorRotateTo() {

}

function testVectorRotateBy() {

}

function runTests() {
  lg(0, "Running test suite...");
  testVector();
  lg(0, "Test suite complete");
}

runTests();
