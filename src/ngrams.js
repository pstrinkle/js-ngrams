/**
 * URL: http://pstrinkle.github.io/js-ngrams
 * Author: Patrick Trinkle <https://github.com/pstrinkle>
 * Version: 1.0.0
 * Copyright 2016 Patrick Trinkle
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** XXX: In investigating the best way to write plugins that are safe for 
 * inclusion with other code, this wasn't quite it, but it's a step towards it. 
 */

/**
 * Initially a super basic bigrams text generative model.
 */
function Ngrams() {
    "use strict";
    this.init();
}

Ngrams.prototype = {
    constructor: Ngrams,
    /**
     * Where we store the current model.
     *
     * Super silly and easy.  Likely will come up with a better approach.
     *
     * It is a two-deep object.  Since it needs to be sorted for speedup, I'll
     * likely have that operation occur whenever it learns from a new document.
     */
    bigrams: {},

    /* for reference. */
    alphabet: {},

    init: function() {
        this.bigrams = {};
        this.alphabet = {};
        return;
    },

    getBigrams: function() {
        return this.bigrams;
    },

    addBigram: function(now, next) {
        if (this.bigrams[now] == undefined) {
            this.bigrams[now] = {};
        }

        if (this.bigrams[now][next] == undefined) {
            this.bigrams[now][next] = 0;
        }

        this.bigrams[now][next] += 1;
    },

    /**
     * Build a bigram model based on this initial input,
     * you can add more data to the model if you want later.
     */
    train: function(terms) {
        for (var i = 0; i < terms.length; i++) {
            var l = terms[i].toLowerCase();
            if (l.length < 2) {
                continue;
            }

            /* handle edge case: sentence starts with. */
            this.addBigram('|', l[0]);

            for (var j = 0; j < (l.length-1); j++) {
                var t0 = l[j];
                var t1 = l[j+1];
                this.addBigram(t0, t1);

                this.alphabet[t0] = 1; /* just boolean. */
                this.alphabet[t1] = 1;
            }
        }

        return;
    },

    generate: function(curr) {
        curr = curr.toLowerCase();

        if (this.bigrams[curr] == undefined) {
            /* We don't know what to draw, should just randomly draw from
             * the alphabet.
             */
            return "";
        }

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
        // Returns a random number between min (inclusive) and max (exclusive)
        var getRandomArbitrary = function(min, max) {
            return Math.random() * (max - min) + min;
        }

        var options = [];
        var totalCnts = 0;
        var percentage = 0.0;
        var random_num = getRandomArbitrary(0, 1);
        var available = Object.keys(this.bigrams[curr]);

        for (var i = 0; i < available.length; i++) {
            var t = available[i];
            var c = this.bigrams[curr][t];

            options.push([t, c]);
            totalCnts += c;
        }

        for (var i = 0; i < options.length; i++) {
            var o = options[i]; // [0] == letter, [1] == count
            percentage += (o[1] / totalCnts);
            if (random_num <= percentage) {
                return o[0];
            }
        }
    },
};

/**
 * Better model, uses trigrams instead of bigrams.
 */
function Ngrams3() {
    "use strict";
    this.init();
}

Ngrams3.prototype = {
    constructor: Ngrams3,

    /**
     * Where we store the current model.
     *
     * Super silly and easy.  Likely will come up with a better approach.
     *
     * It is a two-deep object.  Since it needs to be sorted for speedup, I'll
     * likely have that operation occur whenever it learns from a new document.
     */
    trigrams: {},

    alphabet: {},

    getTrigrams: function() {
        return this.trigrams;
    },

    addTrigram: function(prev, now, next) {
        if (this.trigrams[prev] == undefined) {
            this.trigrams[prev] = {};
        }

        if (this.trigrams[prev][now] == undefined) {
            this.trigrams[prev][now] = {};
        }

        if (this.trigrams[prev][now][next] == undefined) {
            this.trigrams[prev][now][next] = 0;
        }

        this.trigrams[prev][now][next] += 1;
    },

    starts: {},

    addStart: function(now) {
        if (this.starts[now] == undefined) {
            this.starts[now] = 0;
        }

        this.starts[now] += 1;
    },

    init: function() {
        this.trigrams = {};
        this.starts = {};
        this.alphabet = {};
        return;
    },

    /**
     * Build a bigram model based on this initial input,
     * you can add more data to the model if you want later.
     */
    train: function(terms) {
        for (var i = 0; i < terms.length; i++) {
            var l = terms[i].toLowerCase();
            if (l.length < 3) {
                continue;
            }

            /* handle edge case: sentence starts with. */
            this.addTrigram('|', l[0], l[1]);
            this.addStart(l[0]);

            for (var j = 0; j < (l.length-2); j++) {
                var t0 = l[j];
                var t1 = l[j+1];
                var t2 = l[j+2];
                this.addTrigram(t0, t1, t2);

                this.alphabet[t0] = 1; /* just boolean for now */
                this.alphabet[t1] = 1;
                this.alphabet[t2] = 1;
            }
        }

        return;
    },

    generate: function(prev, curr) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
        // Returns a random number between min (inclusive) and max (exclusive)
        var getRandomArbitrary = function(min, max) {
          return Math.random() * (max - min) + min;
        }

        var options = [];
        var totalCnts = 0;
        var percentage = 0.0;
        var random_num = getRandomArbitrary(0, 1);

        if (prev === '|' && curr == undefined) {
            /* first letter. */                

            var available = Object.keys(this.starts);

            for (var i = 0; i < available.length; i++) {
                var t = available[i];
                var c = this.starts[t];
                options.push([t, c]);
                totalCnts += c;
            }
        } else {
            prev = prev.toLowerCase();
            curr = curr.toLowerCase();

            if (this.trigrams[prev] == undefined ||
                this.trigrams[prev][curr] == undefined) {
                /* we don't know what's next, so just randomly draw.
                 * we could randomly draw based on how often the letters 
                 * occurred in a tf*idf way.
                 */
                return "";
            }

            var available = Object.keys(this.trigrams[prev][curr]);

            for (var i = 0; i < available.length; i++) {
                var t = available[i];
                var c = this.trigrams[prev][curr][t];
                options.push([t, c]);
                totalCnts += c;
            }
        }

        for (var i = 0; i < options.length; i++) {
            var o = options[i]; // [0] == letter, [1] == count
            percentage += (o[1] / totalCnts);
            if (random_num <= percentage) {
                return o[0];
            }
        }
    },
};
