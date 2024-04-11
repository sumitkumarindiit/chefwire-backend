import mongoose from "mongoose";

const Schema = mongoose.Schema;
const qnaSchema = new Schema({
  reataurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
    index: true,
  },
  question: {
    type: String,
    required:true
  },
  answer: {
    type: String,
    required: true,
  }
},{ timestamps: true });

const Qna = mongoose.model("Qna", qnaSchema);
export default Qna;
