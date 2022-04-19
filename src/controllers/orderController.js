const orderModel = require('../models/orderModel')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')
const mongoose = require('mongoose')

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

//----------------------------------------------------------------------------------------------------------------------

let createOrder = async function (req, res) {
    try {
        const userId = req.params.userId;
        const idFromToken = req.userId
        if (!isValid(userId)) {
            return res.status(400).send({ status: false, message: "Enter the userId" });
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Enter a valid userId" });
        }

        const user = await userModel.findOne({ _id: userId });
        if (!user) {
            return res.status(404).send({ status: false, message: "User not found" });
        }

        if (userId != idFromToken) {
            return res.status(403).send({ status: false, message: "User not authorized" })
        }

        const requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Enter cart details" });
        }

        const { cartId } = requestBody;
        if (!isValid(cartId)) {
            return res.status(400).send({ status: false, message: "Enter the cartId" });
        }

        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Enter a valid cartId" });
        }
        const cartAlreadyPresent = await cartModel.findOne({ _id: cartId });
        if(!cartAlreadyPresent){
            return res.status(404).send({ status: false, message: "cart not found" });
        }
        if(cartAlreadyPresent.userId!=userId){
            return res.status(400).send({ status: false, message: "With this user cart is not created" });
        }
        if(cartAlreadyPresent.totalItems==0){
            return res.status(400).send({ status: "SUCCESS", message: "There is no product to order ,First add product" })
          }

            let totalPrice = cartAlreadyPresent.totalPrice;
            let totalItems= cartAlreadyPresent.items.length
            let totalQuantity = 0

            let itemsArr = cartAlreadyPresent.items
            for (i in itemsArr) {
                    totalQuantity+=itemsArr[i].quantity
                    
            }
        
        let newOrder = {
            userId:userId,
            items:cartAlreadyPresent.items,
            totalPrice:totalPrice,
            totalItems:totalItems,
            totalQuantity:totalQuantity
        };

        orderData = await orderModel.create(newOrder);
        return res.status(200).send({ status: "SUCCESS", message: "Order placed successfully", data: orderData });
     
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//----------------------------------------------------------------------------------------------------------------------

const updateOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const idFromToken = req.userId

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Enter a valid userId" });
        }

        const user = await userModel.findOne({ _id: userId });
        if (!user) {
            return res.status(404).send({ status: false, message: "User not found" });
        }

        if (userId != idFromToken) {
            return res.status(403).send({ status: false, message: "User not authorized" })
        }

        const data = req.body
        const { status, orderId } = data
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Enter data" });
        }

        if (!isValid(orderId)) {
            return res.status(400).send({ status: false, message: "Enter a orderId" });
        }

        if (!isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "Enter a valid orderId" });
        }

        const orderData = await orderModel.findOne({ _id: orderId, isDeleted: false });
        if (!orderData) {
            return res.status(404).send({ status: false, message: "order not found" });
        }
        if (orderData.userId != userId) {
            return res.status(400).send({ status: false, message: "This user not have any order" });
        }
        if (!isValid(status)) {
            return res.status(400).send({ status: false, message: "Enter a status" });
        }

        if (['pending', 'completed', 'cancelled'].indexOf(status)==-1) {
            return res.status(400).send({ status: false, message: "status sould be one of the pending, completed, cancelled" });
        }

        if (orderData.status == "completed") {
            return res.status(400).send({ status: false, message: "order is already get completed" });
        }

        if (orderData.status == "cancelled") {
            return res.status(400).send({ status: false, message: "order is already get cancelled" });
        }

        if (orderData.cancellable == true) {
            let updatedData = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })
            return res.status(200).send({ status: false, message: "Order cancelled Successfully", data: updatedData });
        }

        return res.status(400).send({ status: false, message: "You're not cancel this product" });
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createOrder, updateOrder }