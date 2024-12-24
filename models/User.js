import mongoose from "mongoose";

export const userSchema = mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    gender: {
      type: String,
      enum: ["male", "female", 'others'],
      default: "others",
    },
    password: { type: String, required: true },
    normalPassword: { type: String, required: true },
    phone: { type: String, required: true },
    dob: { type: Date, required: true },
    role: {
      type: String,
      enum: ["Admin", "User"],
      default: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


export default mongoose.model("User", userSchema);
