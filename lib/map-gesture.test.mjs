import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beginGesture, updateGesture } from './map-gesture.ts';
test('one finger pans without changing scale', () => {
 const start=beginGesture([{x:10,y:20}],1,{x:30,y:-10});
 assert.deepEqual(updateGesture(start,[{x:50,y:5}],.3,2.6),{zoom:1,pan:{x:70,y:-25}});
});
test('pinch doubles scale while keeping the world point under its midpoint', () => {
 const start=beginGesture([{x:0,y:20},{x:100,y:20}],1,{x:10,y:0});
 assert.deepEqual(updateGesture(start,[{x:-50,y:20},{x:150,y:20}],.3,2.6),{zoom:2,pan:{x:-30,y:-20}});
});
test('pinch can translate and is bounded at both zoom limits', () => {
 const start=beginGesture([{x:-50,y:0},{x:50,y:0}],1,{x:0,y:0});
 assert.deepEqual(updateGesture(start,[{x:-200,y:30},{x:400,y:30}],.3,2.6),{zoom:2.6,pan:{x:100,y:30}});
 assert.equal(updateGesture(start,[{x:0,y:0},{x:1,y:0}],.3,2.6).zoom,.3);
});
test('lifting a finger rebases the drag without a camera jump', () => {
 const pinch=beginGesture([{x:-50,y:0},{x:50,y:0}],1,{x:0,y:0});
 const camera=updateGesture(pinch,[{x:-100,y:0},{x:100,y:0}],.3,2.6);
 const drag=beginGesture([{x:100,y:0}],camera.zoom,camera.pan);
 assert.deepEqual(updateGesture(drag,[{x:100,y:0}],.3,2.6),camera);
 assert.deepEqual(updateGesture(drag,[{x:120,y:10}],.3,2.6),{zoom:2,pan:{x:20,y:10}});
});
test('coincident fingers do not cause NaN or infinity', () => {
 const start=beginGesture([{x:0,y:0},{x:0,y:0}],1,{x:0,y:0});
 const camera=updateGesture(start,[{x:0,y:0},{x:10,y:0}],.3,2.6);
 assert.ok(Number.isFinite(camera.zoom)&&Number.isFinite(camera.pan.x));
});
