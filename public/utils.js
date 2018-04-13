function lg() {
  var type = '';
  var message = arguments[0];
  var args = [];
  if (arguments.length > 1) {
    var type = arguments[0];
    var message = arguments[1];
    for (var i = 2; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
  }
  var suffix = "#️⃣";
  var logFunc = console.log;
  if (type === "w") { // warning
    suffix = "⚠️";
    logFunc = console.warn;
  } else if (type === "e") { // error
    suffix = "⛔";
    logFunc = console.error;
  } else if (type === "s") { // success
    suffix = "✅";
  } else if (type === "f") { // fail 
    suffix = "❎";
  }
  logFunc(suffix + " " + message);
  for (var i = 0; i < args.length; i++) {
    console.log(args[i]);
  }
}