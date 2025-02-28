import mongoose, { Schema, model } from 'mongoose';

const invoiceSchema = Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true
        },
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }
);

export default model('Invoice', invoiceSchema);
