function scrollToEnd(elem) {
    elem.scrollLeft = elem.scrollWidth;
}

function scrollToBottom(elem) {
    elem.scrollTop = elem.scrollHeight;
}

//note: for arrays that contain primitive types only
function arraysAreEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

//CONVERT 24 HOUR TIMES TO 12 HOUR TIMES
function toTwelveHourTime(twentyFourHourTime) {
    let time = twentyFourHourTime.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [twentyFourHourTime];

    if (time.length > 1) { 
        time = time.slice(1);
        time[5] = +time[0] < 12 ? ' AM' : ' PM';
        time[0] = +time[0] % 12 || 12;

        return time.join('');
    }
    else {
        console.warn('invalid time format passed to "toTwelveHourTime()"');
    }
}

// Check if `child` is a descendant of `parent`
function isDescendant(parent, child) {
    let node = child.parentNode;
    while (node) {
        if (node === parent) {
            return true;
        }

        // Traverse up to the parent
        node = node.parentNode;
    }

    // Go up until the root but couldn't find the `parent`
    return false;
};

//check if input string is a positive whole number
function stringIsPositiveInt(numString) {
    if(!numString) return false;
    
    let x = Number(numString);

    if (Number.isInteger(x) && x >= 0) return true;
    else return false;
}

//get color hex from color class
function resolveColor(colorClass) {
    switch(colorClass) {
        case('pink'):
            return '#ff4081';
        case ('red'):
            return '#ff1744';
        case ('purple'):
            return '#e040fb';
        case ('blue'):
            return '#40c4ff';
        case ('dark-blue'):
            return '#536dfe';
        case ('green'):
            return '#69f0ae';
        case ('orange'):
            return '#ff6e40';
        case ('deep-orange'):
            return '#ff3d00';
        case ('yellow'):
            return '#ffea00';
        case ('lime'):
            return '#c6ff00';
        case ('black'):
            return '#000';
        default:
            console.warn('Invalid color class was passed to the "resolveColor()"');
            return '#000';
    }
}

function rgbToHex(rgbString) {
    try {
        let rbgRegex = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/;
        let colors = rbgRegex.exec(rgbString);

        return (colors) ?
            '#' + ((1 << 24) + (~colors[0] << 16) + (~colors[1] << 8) + ~colors[2]).toString(16) :
            (() => { throw new Error('ERROR: invalid RBG string'); });
    }
    catch (err) {
        console.error(err);
        return '#000';
    }
}

//accepts 12hr time
// mode 0 = time array [hr,min,sec]
// mode 1 = minutes representation
// mode 2 = both [minutes, [hr,min,sec]]
function parseTime(timeString, mode = 1) {
    let UDTfix = (timeString.length > 11) ? true : false;
    let hms, minutes;

    if (UDTfix)
        timeString = new Date(timeString).toLocaleTimeString();

    hms = timeString.substring(0, 11).split(/:| /);

    switch (mode) {
        case 0:
            return hms;
        case 1:
        case 2:
            minutes = (+hms[0]) * 60 + (+hms[1]);

            if (hms[hms.length - 1] == 'PM')
                minutes = (+hms[0] != 12) ? minutes + 720 : minutes;
            else if (hms[hms.length - 1] == 'AM')
                minutes = (+hms[0] != 12) ? minutes : minutes - 720;

            if (mode == 1)
                return minutes;
            else {
                if ((hms[hms.length - 1] == 'AM' && +hms[0] == 12))
                    return [minutes, [(+hms[0] - 12), +hms[1]]];
                if ((hms[hms.length - 1] == 'PM' && +hms[0] != 12))
                    return [minutes, [(+hms[0] + 12), +hms[1]]];

                return [minutes, [+hms[0], +hms[1]]];
            }
        default:
            throw new Error('invalid mode (' + mode + ')');
    }
}

//returns 12hr time;
function timeToString(time = clockCurrTime, round = true) {
    if (round)
        time = ((time % 1) > 0.5) ? Math.ceil(time) : Math.floor(time);

    let hours = Math.floor(time / 60);
    let minutes = time % 60;

    if (hours < 12)
        return (hours == 0) ? ('00' + hours + 12).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM' :
            ('00' + hours).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM';
    else if (hours == 12)
        return ('00' + 12).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' PM';
    else
        return (hours == 24) ? ('00' + (hours - 12)).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM' :
            ('00' + (hours - 12)).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' PM';
}

//returns 24hr time
function convertTime12to24(time12h) {
    const [time, modifier] = time12h.split(' ');

    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }

    return `${hours}:${minutes}`;
}

function findSubArray(arr, subarr, from_index=0) {
    var i = from_index >>> 0,
        sl = subarr.length,
        l = arr.length + 1 - sl;

    loop: for (; i < l; i++) {
        for (var j = 0; j < sl; j++)
            if (arr[i + j] !== subarr[j])
                continue loop;
        return i;
    }
    return -1;
}

// tag: string
// classes: string / string array
// props: object of { key: (prop) valu: (val) } pairs
//...children: child nodes to append (string, nodes, or arrays of both )
function createElement(tag, classes, props, ...children) {
    const element = document.createElement(tag);

    if(classes) {
        if (Array.isArray(classes))
            classes.forEach( classString => { element.classList.add(classString); });

        else if (typeof classes === 'string' && !classes.includes(' '))
            element.classList.add(classes);

        else
            console.warn('invalid classes passed to createElement.' );
    }

    if (props) {
        Object.entries(props).forEach(([key, value]) => {
            if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.substring(2), value);
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });
    }

    children.forEach(child => {
        if (Array.isArray(child)) {
            return element.append(...child);
        }

        if (typeof child === 'string' || typeof child === 'number') {
            child = document.createTextNode(child);
        }

        if (child instanceof Node) {
            element.appendChild(child);
        }
    });

    return element;
}

export { scrollToEnd, scrollToBottom, arraysAreEqual, isDescendant, toTwelveHourTime, stringIsPositiveInt, 
    resolveColor, rgbToHex, parseTime, timeToString, convertTime12to24, findSubArray, createElement };