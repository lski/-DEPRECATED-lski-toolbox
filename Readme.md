Lski-Toolbox
============

A simple toolbox including some useful functions for various projects. I have been reducing this toolbox down as there are better implementations out there in specific libraries e.g. originally it contained a cross browser ajax class and a cookie class, that have since been depreciated.

This library has no dependencies, but includes some useful functions e.g. some date handling functions with a json rectifier and reviver for handling .Net dates, also some array based functions.

I have kep most functions under the lski namespace to avoid collisions, however the toolbox provides a shim to the following functions: 

- String.trim()
- Array.indexOf(start)
- String.toTitleCase() - (ready for when its actually implemented :P)