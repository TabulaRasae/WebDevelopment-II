import mongoose from "mongoose";

const loginSchema = new mongoose.Schema({
  userid: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.models.login || mongoose.model("login", loginSchema);

export default User;
