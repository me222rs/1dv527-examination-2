var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection(process.env.DATABASE);
autoIncrement.initialize(connection);

let catchSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
    },
    position: {
        type: String,
        required: true,
    },
    specie: {
        type: String,
        required: true,
    },
    weight: {
        type: Number,
        required: true,
    },
    length: {
        type: Number,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    timestamp: {
        type: String,
        required: true,
    },
    other: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: false,
    }
});
catchSchema.plugin(autoIncrement.plugin, { model: 'Catch', field: 'catchId' });
// Create a model using the schema.
let Catch = mongoose.model("Catch", catchSchema);

// Export the model.
module.exports = Catch;
