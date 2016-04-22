/**
 * Created by sparshithp on 4/18/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Group', new Schema({
    players: [{ type : ObjectId, ref: 'Player' }],
    amount: Number,
    name: String
}));