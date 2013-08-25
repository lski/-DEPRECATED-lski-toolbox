
;(function(window, document, undefined) {

    /**
	* As IE<8 does not support trim add it if not exists
	*/
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        }
    }

    /**
	* MDC version of indexOf for browsers that dont have it, I have the lski.Array.Find method that returns the actual item on found, but as
	* this is built in it should be quicker for simple searches
	*/
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elt /*, from*/) {
			
            var len = this.length >>> 0;
            var from = Number(arguments[1]) || 0;
            from = (from < 0) ? Math.ceil(from) : Math.floor(from);
            if (from < 0)
                from += len;

            for (; from < len; from++) {
                if (from in this && this[from] === elt)
                    return from;
            }
            return -1;
        };
    }

    ///**
	//* Removes elements from the array, from the position passed 'from' to the position passed 'to'. Unknown reference.
	//*/
    //Array.prototype.remove = function (from, to) {
		
    //    this.splice(from, !to || 1 + to - from + (!(to < 0 ^ from >= 0) && (to < 0 || -1) * this.length));
    //    return this.length; 
    //};

    /**
	* Function convert the current string to titlecase. From www.thewatchmakerproject.com, and is non-destructive to the original string
	* @returns ew string
	*/
    if(!String.prototype.toTitleCase) {
        String.prototype.toTitleCase = function () {

            var originalWords = this.split(' '), 
				editedWords = [];

            for (var i = 0; originalWords[i] !== undefined; i++) {
                editedWords[editedWords.length] = originalWords[i].substr(0, 1).toUpperCase() + originalWords[i].substr(1);
            }

            return editedWords.join(' ');
        }
    }

    /**
	* Create my namespace to include each of my methods so they do not conflict with other APIs
	*/
    window.lski = (function() {

        var lski = {
            json: {
			
                /**
				* A reviver function to help JSON.parse(stringToParse, reviver) when receiving dates that are returned from ASP.Net which are
				* in the format /Date(ticks)/ so need coercing into a javascript datetime
				*/
                parseMsDate: function (key, value) {

                    if (typeof value == 'string' && value.match("^/Date\\((\\d+)\\)/$"))
                        return new Date(parseInt(value.replace(/\/Date\((-?\d+)\)\//, '$1')));

                    return value;
                },
			
                /**
				* A rectifier method used to help JSON.stringfy(JsonObj, rectifier) to handle creating a date for ASP.Net which are
				* in the format /Date(ticks)/ so need coercing into string that can be parsed by by ASP.Net
				*/
                stringifyMsDate: function (key, value) {

                    if (value && value.getTime)
                        '"\\\/Date(' + value.getTime() + ')\\\/"';

                    return value;
                },

                parseIso8601Date:  function (key, value) {
                    /// <summary>Uses pattern matching to discover if a string contains a date in ISO 8601 format, if it is then create a date, othrwise return a string</summary>
                    /// <param name="key" type="string">The object property name</param>
                    /// <param name="value" type="Object">The string value to be converted either to a string or date</param>

                    var a;

                    if (typeof value === 'string') {

                        a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)/.exec(value);

                        if (a) {
                            return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
                        }
                    }
                    return value;
                }
            },
			
            number: {
			
                /**
				* Rounds a number to a certain no of decimal places
				* 
				* @param - String|Number - Either a string containing a parseable number OR a number
				* @returns - Number or Null on failure
				*/
                round: function (num, decimalPlaces) {

                    var val = (typeof num !== 'number' ? parseFloat(num) : num);

                    if (val === null)
                        return null;
					
                    return val.toFixed(parseInt(decimalPlaces, 10));
                },
				
                /**
				* Returns the passed number, rounded to the correct number of dp, with the trailing zeros added as appropriate.
				* Note: needs to be updated to use regular expressions rather than the parseFunctions as they are only good upto a certain
				* point
				*
				* @param num - String|Number - Either a string containing a parseable number OR a number
				* @param decimalPlaces - Number - The no of dp to round to
				* @returns - String or Null on failure
				*/
                format: function (num, decimalPlaces, addCommas) {
				
                    function AddCommas(val) {
			
                        // Truncate the off any decimal places
                        var parsedVal = (parseInt(val, 10) + '');
						
                        var reg = /(\d+)(\d{3})/;
                        while (reg.test(parsedVal)) {
                            parsedVal = parsedVal.replace(reg, '$1' + ',' + '$2');
                        }
						
                        return parsedVal;
                    };
					
                    function EnforceDP(val, decimalPlaces) {
						
                        var rounded = this.round(val, decimalPlaces);
						
                        if(rounded === null) {
                            return null;
                        }
						
                        rounded = rounded + '';
						
                        var dotPos = rounded.indexOf('.'),
							// If there is no '.' because the original is a whole number, create a blank start for decimalVal
							decimalVal = (dotPos === -1 ? '' : rounded.substring(dotPos + 1)),
							// If there is no '.' then use an
							withZeros = (dotPos === -1 ? [] : ['.', decimalVal]);
						
                        for(var decimalLength = decimalVal.length; decimalLength < decimalPlaces; decimalLength++) {
                            withZeros.push('0');
                        }
						
                        return (withZeros.join(''));
                    };
					
                    // Just check we are dealing with a number
                    if(isNaN(num = parseFloat(num))) {
                        return null;
                    }
					
                    return (addCommas ? AddCommas(num) : (parseInt(num, 10) + '')) + EnforceDP.call(this, num, decimalPlaces);
                },

                /**
				* A function designed to remove formatting from a number formatted as a string with a prefix for currency
				*
				* @param string num the variable to change back into an unformatted number
				* @return Number
				*/
                removeFormatNumber: function (num) {
                    return num.replace(/([^0-9\.\-])/g, '') * 1;
                }
            },

            misc: {

                /**
				* Calculates and returns the parameters supplied to the webpage via the query string and populates an object with each of the property names
				* corresponding to a key from querystring (adapted from code found on StackOverflow, ref not known)
				*/
                urlParams: function () {

                    var results, // The results, with name = results[1] and value = results[2]
						plusReplaceRegEx = /\+/g,  // Regex for replacing addition symbol with a space
						r = /([^&=]+)=?([^&]*)/g,
						decodeFunc = function (s) { return decodeURIComponent(s.replace(plusReplaceRegEx, " ")); },
						queryString = window.location.search.substring(1);

                    var urlParams = {};

                    while (results = r.exec(queryString)) {
                        urlParams[decodeFunc(results[1])] = decodeFunc(results[2]);
                    }

                    return urlParams;
                },

                /**
				* Does flat serialization encoding of an object for an encoded get request, only serialises strings/numbers/boolean, for more advanced stuff use a library
				*/
                encodeObject: function (obj) {

                    var str = [];
                    for (var p in obj) {

                        if (typeof (p) == 'string' || typeof (p) == 'number' || typeof (p) == 'boolean')
                            str.push(p + "=" + encodeURIComponent(obj[p]));
                    }
                    return str.join("&");
                },

                /**
				* Simple preload images function
				*/
                preloadImages: function (imageArray) {

                    var newimages = [];
                    imageArray = (typeof imageArray !== "object") ? [imageArray] : imageArray; //force arr parameter to always be an array

                    for (var i = 0, n = imageArray.length; i < n; i++) {
                        newimages[i] = new Image();
                        newimages[i].src = imageArray[i];
                    }
                }

            },

            events: {

                /**
				* Can be passed as a handler to keydown on a textbox/textarea for preventing chars that are not numeric. Can be attached directly.
				*
				* @param Event event - the event object either passed
				* @param Boolean allowSpaces - if set to true, does not consider a space a fail so will return true.
				* @returns Boolean - If not a valid char (i.e. a number) it returns false, otherwise returns true
				*/
                numericsOnly: function(event, allowSpaces) {

                    // Get event in IE
                    if(!event && window.event)
                        event = window.event;

                    var key = (event.which || event.charCode || event.keyCode);

                    // If a movement character (up, down, tab etc) then allow, also if allowing spaces then check that too
                    if (([8, 9, 46, 35, 36, 37, 38, 39, 40]).indexOf(key) > -1 || (allowSpaces === true && key === 32)) {
                        return true;
                    }
					
                    // If a normal char, then only allow if a number (keypad or top line)
                    if (([48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105]).indexOf(key) == -1) {
                        return false;
                    }
					
                    return true;
                }
            },

            /**
			* Namespace including some element information not supplied by jQuery
			*/
            elements: {

                /**
				* Returns the start position and text of the currently selected text of a textarea control.
				*
				* @param - element - target - The text area element to work on
				* @returns - object - { start: 0, text: 'This is the area of text selected' }
				*/
                getSelectionPosition: function (target) {

                    scrollPosition = target.scrollTop;

                    if (document.selection) {

                        selection = document.selection.createRange().text;

                        if (target.selectionStart === undefined) { // ie

                            var range = document.selection.createRange();
                            var rangeCopy = range.duplicate();

                            rangeCopy.moveToElementText(target);
                            caretPosition = -1;

                            while (rangeCopy.inRange(range)) {
                                rangeCopy.moveStart('character');
                                caretPosition++;
                            }

                        } else { // opera
                            caretPosition = target.selectionStart;
                        }

                    } else { // gecko & webkit

                        caretPosition = target.selectionStart;
                        selection = target.value.substring(caretPosition, target.selectionEnd);
                    }

                    return { start: caretPosition, text: selection };
                }
            },

            string: {

                /**
				* Function that truncates a string to a certain value and adds three dots to the end if desired
				* 
				* @param string - str - The string to shrink 
				* @param int - maxSize - the size to cut the string to
				* @param bool optional - addDots - Adds dots to the end of the string (with dots it still remains less than max size)
				* @return string
				*/
                shrink: function (str, maxSize, addDots) {

                    if (str.length <= maxSize) {
                        return str;
                    }

                    // Cleanup the optional passed $addDots, by ensuring it was in fact an exact true rather than evaluting to true
                    if (addDots !== true) {
                        addDots = false;
                    }

                    //Change the max size if it should add dots, (and also ensuring that max sixe -3 isnt below zero)
                    maxSize = ((addDots) && ((maxSize - 3) > 0)) ? maxSize - 3 : maxSize;

                    return str.substr(0, maxSize) + ((addDots) ? '...' : '');
                },

                /**
				* Checks whether the value contained in this string is in a very BASIC valid email format, using the basic idea that it needs an @ 
				* and at least one '.' after it 
				*
				* @param string - str - The string to check if a valid email address
				* @return bool
				*/
                isValidEmail: function (str) {
                    return (/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/).test(email);
                },


                /**
				* Returns a new version of this string with HTML entities
				*
				* @return string
				*/
                htmlEntities: function ($str) {
                    str.replace(/& /g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                },

                /**
				* Returns a new version of this string without HTML entities
				*
				* @return string
				*/
                stripHtmlEntities: function ($str) {
                    return $str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                }
				
            }
        };
		
        //* Private Members *//
		
        /**
		* Ensure the value is a float, if not a number or a string that can be turned into a number, then null is returned
		*/
        var _toFloat = function(val) {
			
            if (typeof num !== 'number') {
                num = parseFloat(num);
            }

            if (isNaN(num)) {
                return null;
            }
        }
		
        // Now return the lski object
        return lski;		
    })();

})(window, document);

