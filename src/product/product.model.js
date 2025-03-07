import mongoose, {Schema, model} from 'mongoose';

const productSchema = Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  stock: { type: Number, required: true },
});


export default model ("Product",productSchema);
