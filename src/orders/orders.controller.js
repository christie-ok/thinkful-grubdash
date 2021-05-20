const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function validOrderInfo(req, res, next) {
    const {data: {deliverTo, mobileNumber, dishes, id, status}} = req.body;

    if(!deliverTo || deliverTo == "") {
        return next({
            status: 400,
            message: "Order must include a deliverTo"
        })
    };

    if(!mobileNumber || mobileNumber == "") {
        return next({
            status: 400,
            message: "Order must include a mobileNumber"
        })
    };
    
    if(!dishes || !Array.isArray(dishes) || !dishes.length) {
        return next({
            status: 400,
            message: "Order must include at least one dish"
        })
    }

    dishes.forEach((dish, index) => {
        const {quantity} = dish;
        if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            })
        }
    });

        res.locals.deliverTo = deliverTo;
        res.locals.mobileNumber = mobileNumber;
        res.locals.dishes = dishes;
        res.locals.id = id;
        res.locals.status = status;
    
        next();   
};

function orderExists(req, res, next) {
    const {orderId} = req.params;
    const foundOrder = orders.find((order) => order.id == orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        next();
    }
    next({
        status: 404,
        message: `No matching order (${orderId}) found.`
    });
};

function idBodyRouteMatch(req, res, next) {
    const {orderId} = req.params;
    const {data: {id}} = req.body;

    if (!id || id == orderId) return next();

    if (id != orderId) {
        return next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
        })
    }
    next();
};

function orderStatusChecker(req, res, next) {
    const {data: {status = ""}} = req.body;
    const statusList = ["pending", "preparing", "out-for-delivery", "delivered"];

    if(!status || status == "" || !statusList.includes(status)) {
        return next({
            status: 400,
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
        })
    };

    if(status === "delivered") {
        return next({
            status: 404,
            message: "A delivered order cannot be changed"
        })
    };
    res.locals.status = status;
    next();
};

function statusPending(req, res, next) {
    const {orderId} = req.params;
    if (res.locals.order.status !== "pending") {
        return next({
            status: 400,
            message: "An order cannot be deleted unless it is pending"
        })
    };
    next();
};


function list(req, res, next) {
    res.json({data: orders});
}

function addOrder(req, res, next) {
    const newOrder = {
        id: nextId(),
        deliverTo: res.locals.deliverTo,
        mobileNumber: res.locals.mobileNumber,
        status: "pending",
        dishes: res.locals.dishes,
    }
    orders.push(newOrder);
    res.status(201).json({data: newOrder})
}

function read(req, res, next) {
    res.json({data: res.locals.order})
};

function update(req, res, next) {
    let order = res.locals.order;
    
    order = {
        ...order,
        deliverTo: res.locals.deliverTo,
        mobileNumber: res.locals.mobileNumber,
        dishes: res.locals.dishes,
        status: res.locals.status
    };

    res.json({data: order});
};

function destroy(req, res, next) {
    const {orderId} = req.params;
    const index = orders.indexOf((order) => order.id == orderId);
    orders.splice(index, 1);

    res.sendStatus(204);
}

module.exports = {
    list,
    create: [validOrderInfo, addOrder],
    read: [orderExists, read],
    update: [orderExists, validOrderInfo, idBodyRouteMatch, orderStatusChecker, update],
    delete: [orderExists, statusPending, destroy]
}