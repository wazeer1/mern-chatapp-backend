const mongoose = require('mongoose')
require('dotenv').config();

mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PW}@ac-tv9mylj-shard-00-00.wbirhac.mongodb.net:27017,ac-tv9mylj-shard-00-01.wbirhac.mongodb.net:27017,ac-tv9mylj-shard-00-02.wbirhac.mongodb.net:27017/?ssl=true&replicaSet=atlas-7v4wlv-shard-0&authSource=admin&retryWrites=true&w=majority`,
()=>{
    console.log('connected to mongodb');
})
