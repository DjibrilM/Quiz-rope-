const { Types } = require('mongoose');

try {
   const o = new Types.ObjectId("64ebdc205d15c721ea5fb521");
   console.log("Valid Hex:", o.toString());

   const o2 = new Types.ObjectId({ _id: "64ebdc205d15c721ea5fb521" });
   console.log("From object:", o2.toString());
} catch(e) {
   console.error(e.message);
}
