/**
 * Created by sparshg on 4/21/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Player', new Schema({
    name: String,
    country: String,
    rating: Number
}));