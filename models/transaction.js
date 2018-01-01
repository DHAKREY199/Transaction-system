var mongoose = require("mongoose");
var TransactionSchema = new mongoose.Schema({
    Clientname: String,
    Amount: Number,
    TransactionID: { type: String, unique: true },
    Transaction_Type:String,
    Disputed: Boolean
});

module.exports = mongoose.model("transaction", TransactionSchema);