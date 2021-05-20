const { reset } = require("nodemon");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function validDishInfo(req, res, next) {
    const {data: {name, description, price, image_url, id}} = req.body;
    if(!name || name == "") {
        return next({
            status: 400, 
            message: "Dish must include a name"
        })
    };
    
    if(!description || description == "") {
        return next({
            status: 400, 
            message: "Dish must include a description"
        })
    };
    
    if(!price || price <= 0 || !Number.isInteger(price)) {
        return next({
            status: 400, 
            message: "Dish must have a price that is an integer greater than 0"
        })
    };
    
    if(!image_url || image_url == "") {
        return next({
            status: 400, 
            message: "Dish must include a image_url"
        })
    };
    

    res.locals.name = name;
    res.locals.description = description;
    res.locals.price = price;
    res.locals.image_url = image_url;
    res.locals.id = id;
    next();
}

function dishExists(req, res, next) {
    const {dishId} = req.params;
    const foundDish = dishes.find((dish) => dishId == dish.id);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    };
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    });
};
 
function idBodyRouteMatch(req, res, next) {
    const {dishId} = req.params;
    const {data: {id}} = req.body;

    if (!id || id == dishId) return next();
    
    if (id != dishId) {
        return next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
        })
    };

    
}

function list(req, res, next) {
    res.json({data: dishes})
};

function addDish(req, res, next) {
    const newDish = {
        id: nextId(),
        name: res.locals.name,
        description: res.locals.description,
        price: res.locals.price,
        image_url: res.locals.image_url
    };

    dishes.push(newDish);
    res.status(201).json({data: newDish});
};

function read(req, res, next) {
    res.json({data: res.locals.dish});
}

function update(req, res, next) {
    let dish = res.locals.dish;

    dish = {
        ...dish,
        description: res.locals.description,
        name: res.locals.name,
        price: res.locals.price,
        image_url: res.locals.image_url
    };

    res.json({data: dish})
};


module.exports = {
    list,
    create: [validDishInfo, addDish],
    read: [dishExists, read],
    update: [dishExists, validDishInfo, idBodyRouteMatch, update]
}