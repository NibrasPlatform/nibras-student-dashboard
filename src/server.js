const app=require('./app.js');
const mongoose=require('./config/database.js');
require('dotenv').config();

const PORT=process.env.PORT ;


app.listen(PORT, async ()=>{
    await mongoose;
    console.log(`Server is running on port ${PORT}`);
});
