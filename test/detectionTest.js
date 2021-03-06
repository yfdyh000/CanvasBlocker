/* eslint no-console: off */
var addTest = (function(){
	"use strict";

	var stati = [
		{className: "notRun", text: "not run"},
		{className: "loud", text: "CB detected"},
		{className: "stealthy", text: "CB not detected"},
		{className: "failed", text: "test failed"}
	];
	var ul = document.getElementById("tests");
	return function addTest(name, func){
		var logs = [];
		function log(){
			logs.push(Array.prototype.slice.call(arguments).join(" "));
		}
		var status = 0;
		try {
			status = func(log)? 1: 2;
		}
		catch (e){
			console.log(e);
			status = 3;
		}
		var li = document.createElement("li");
		li.className = stati[status].className;
		var nameNode = document.createElement("span");
		nameNode.className = "name";
		nameNode.textContent = name;
		nameNode.title = func.toString();
		li.appendChild(nameNode);
		li.appendChild(document.createTextNode(": "));
		var statusNode = document.createElement("span");
		statusNode.className = "status";
		statusNode.textContent = stati[status].text;
		statusNode.title = logs.join("\n");
		li.appendChild(statusNode);
		ul.appendChild(li);
		return li;
	};
}());

function checkPropertyDescriptor(object, name, expectedDescriptor, log){
	"use strict";
	var descriptor = Object.getOwnPropertyDescriptor(object, name);
	var detected = false;
	
	function logProperty(desc, got, expected){
		log("Wrong", desc, "for", name, "- got:", got, "- expected: ", expected);
	}
	function compare(desc, getter){
		var got = getter(descriptor);
		var expected = getter(expectedDescriptor);
		
		if ((typeof expected) === "function"){
			if (got.name !== expected.name){
				detected = true;
				logProperty(desc + " (function name)", expected.name, got.name);
			}
			if (got.length !== expected.length){
				detected = true;
				logProperty(desc + " (function length)", expected.length, got.length);
			}
			const re = "^\\s*function " + expected.name + "\\s*\\(\\)\\s*\\{\\s*\\[native code\\]\\s*\\}\\s*$";
			if (!got.toString().match(new RegExp(re))){
				detected = true;
				logProperty(desc + " (function string)", re, got.toString());
			}
		}
		else if (got !== expected){
			logProperty(desc, got, expected);
			detected = true;
		}
	}
	
	compare("descriptor type", function(v){return typeof v;});
	if (descriptor){
		Object.keys(descriptor).forEach(function(key){
			compare(key, function(v){return v[key];});
		});
	}
	return detected;
}

addTest("function length", function(log){
	"use strict";
	
	if (CanvasRenderingContext2D.prototype.getImageData.length !== 4){
		log("expected 4 parameters for getImageData - got", CanvasRenderingContext2D.prototype.getImageData.length);
		return true;
	}
	else {
		return false;
	}
});
addTest("function code", function(log){
	"use strict";
	var codeDetected = false;
	if (
		!CanvasRenderingContext2D.prototype.getImageData.toString().match(
			/^\s*function getImageData\s*\(\)\s*\{\s*\[native code\]\s*\}\s*$/
		)
	){
		log("unexpected function code:", CanvasRenderingContext2D.prototype.getImageData.toString());
		codeDetected = true;
	}
	if (
		!HTMLCanvasElement.prototype.toDataURL.toString().match(
			/^\s*function toDataURL\s*\(\)\s*\{\s*\[native code\]\s*\}\s*$/
		)
	){
		log("unexpected function code:", HTMLCanvasElement.prototype.toDataURL.toString());
		codeDetected = true;
	}
	return codeDetected;
});
addTest("toString modified", function(log){
	"use strict";
	return checkPropertyDescriptor(
		HTMLCanvasElement.prototype.toDataURL,
		"toString",
		undefined,
		log
	) | checkPropertyDescriptor(
		Object.prototype,
		"toString",
		{
			value: function toString(){},
			writable: true,
			enumerable: false,
			configurable: true
		},
		log
	);
});
addTest("function name", function(){
	"use strict";
	
	return HTMLCanvasElement.prototype.toDataURL.name !== "toDataURL" ||
		CanvasRenderingContext2D.prototype.getImageData.name !== "getImageData";
});
addTest("property descriptor", function(log){
	"use strict";
	
	const properties = [
		{
			object: CanvasRenderingContext2D.prototype,
			name: "getImageData",
			descriptor: {
				value: function getImageData(x, y, w, h){},
				writable: true,
				enumerable: true,
				configurable: true
			}
		},
		{
			object: HTMLCanvasElement.prototype,
			name: "toDataURL",
			descriptor: {
				value: function toDataURL(){},
				writable: true,
				enumerable: true,
				configurable: true
			}
		},
	];
	
	return properties.reduce(function(pass, property){
		return checkPropertyDescriptor(property.object, property.name, property.descriptor, log) || pass;
	}, false);
});
addTest("error provocation 1", function(log){
	"use strict";
	
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");
	var canvasBlocker = false;
	try{
		ctx.getImageData(0, 0, 0, 0);
	}
	catch (err){
		try {
			log(err.name);
			log(err.toString());
		}
		catch (e){
			canvasBlocker = true;
		}
	}
	return canvasBlocker;
});
addTest("error provocation 2", function(log){
	"use strict";
	
	var canvas = document.createElement("canvas");
	canvas.width = 0;
	var ctx = canvas.getContext("2d");
	var canvasBlocker = false;
	try{
		ctx.getImageData(0, 0, 1, 1);
		log("no error provoked");
	}
	catch (err){
		try {
			log(err.name);
			log(err.toString());
		}
		catch (e){
			canvasBlocker = true;
		}
	}
	return canvasBlocker;
});
addTest("error provocation 3", function(log){
	"use strict";
	
	var canvasBlocker = false;
	try{
		CanvasRenderingContext2D.prototype.getImageData.apply(undefined, [0, 0, 1, 1]);
	}
	catch (err){
		try {
			log(err.name);
			log(err.toString());
		}
		catch (e){
			canvasBlocker = true;
		}
	}
	return canvasBlocker;
});
addTest("error properties", function(log){
	"use strict";
	
	var canvasBlocker = false;
	try{
		CanvasRenderingContext2D.prototype.getImageData.apply(undefined, [0, 0, 1, 1]);
	}
	catch (err){
		try {
			var name = "TypeError";
			if (err.name !== name && err instanceof TypeError){
				log("Error name wrong. Expected: ", name, "- got:", err.name);
				canvasBlocker = true;
			}
			var start = "@" + location.href.replace(/\.html$/, ".js");
			if (!err.stack.startsWith(start)){
				log("Error stack starts wrong. Expected:", start, "- got :", err.stack.split(/\n/g, 2)[0]);
				canvasBlocker = true;
			}
			var message = "'getImageData' called on an object that " +
				"does not implement interface CanvasRenderingContext2D.";
			if (err.message !== message){
				log("Error message wrong. Expected: ", message, "- got:", err.message);
				canvasBlocker = true;
			}
		}
		catch (e){
			canvasBlocker = true;
		}
	}
	return canvasBlocker;
});
function testKnownPixelValue(size, log){
	"use strict";
	
	var canvas = document.createElement("canvas");
	canvas.height = size;
	canvas.width = size;
	var context = canvas.getContext("2d");
	var imageData = new ImageData(canvas.width, canvas.height);
	var pixelValues = imageData.data;
	for (let i = 0; i < imageData.data.length; i += 1){
		if (i % 4 !== 3){
			pixelValues[i] = Math.floor(256 * Math.random());
		}
		else {
			pixelValues[i] = 255;
		}
	}
	context.putImageData(imageData, 0, 0);
	var p = context.getImageData(0, 0, canvas.width, canvas.height).data;
	for (var i = 0; i < p.length; i += 1){
		if (p[i] !== pixelValues[i]){
			log("wrong value", p[i], "at", i, "expected", pixelValues[i]);
			return true;
		}
	}
	return false;
}
addTest("known pixel value test 1", function(log){
	"use strict";
	
	return testKnownPixelValue(1, log);
});
addTest("known pixel value test 10", function(log){
	"use strict";
	
	return testKnownPixelValue(10, log);
});
addTest("double readout test", function(log){
	"use strict";
	
	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");
	var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < imageData.data.length; i += 1){
		if (i % 4 !== 3){
			imageData.data[i] = Math.floor(256 * Math.random());
		}
		else {
			imageData.data[i] = 255;
		}
	}
	context.putImageData(imageData, 0, 0);
	
	var imageData1 = context.getImageData(0, 0, canvas.width, canvas.height);
	var imageData2 = context.getImageData(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < imageData2.data.length; i += 1){
		if (imageData1.data[i] !== imageData2.data[i]){
			log("mismatch at", i, ":",
				imageData1.data[i], "(", imageData1.data[i].toString(2), ")",
				"!=",
				imageData2.data[i], "(", imageData2.data[i].toString(2), ")",
				"| original:", imageData.data[i], "(", imageData.data[i].toString(2), ")"
			);
			return true;
		}
	}
	return false;
});
addTest("double readout test (toDataURL)", function(log){
	"use strict";
	
	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");
	var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < imageData.data.length; i += 1){
		if (i % 4 !== 3){
			imageData.data[i] = Math.floor(256 * Math.random());
		}
		else {
			imageData.data[i] = 255;
		}
	}
	context.putImageData(imageData, 0, 0);
	
	var dataURL1 = canvas.toDataURL();
	var dataURL2 = canvas.toDataURL();
	if (dataURL1 !== dataURL2){
		log("data URL missmatch:",
			dataURL1,
			"!=",
			dataURL2
		);
		return true;
	}
	return false;
});
addTest("readout - in - out test", function(log){
	"use strict";
	
	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");
	var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < imageData.data.length; i += 1){
		if (i % 4 !== 3){
			imageData.data[i] = Math.floor(256 * Math.random());
		}
		else {
			imageData.data[i] = 255;
		}
	}
	context.putImageData(imageData, 0, 0);
	
	var imageData1 = context.getImageData(0, 0, canvas.width, canvas.height);
	var canvas2 = document.createElement("canvas");
	var context2 = canvas2.getContext("2d");
	context2.putImageData(imageData1, 0, 0);
	var imageData2 = context2.getImageData(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < imageData2.data.length; i += 1){
		if (imageData1.data[i] !== imageData2.data[i]){
			log("mismatch at", i, ":",
				imageData1.data[i], "(", imageData1.data[i].toString(2), ")",
				"!=",
				imageData2.data[i], "(", imageData2.data[i].toString(2), ")"
			);
			return true;
		}
	}
	return false;
});