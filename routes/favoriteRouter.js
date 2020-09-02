const express = require('express');

const bodyParser = require('body-parser');

const mongoose = require('mongoose');

// this is authenticate wali file
const authenticate = require('../authenticate');
const cors = require('./cors');

// importing favorite model
const Favorites = require('../models/favorite');

// configuring favoriteRouter as express router
const favoriteRouter = express.Router();

// using body parser
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorites.find({})
            .populate('user')
            .populate('dishes')
            .then((favorites) => {
                // extract favorites that match the req.user.id
                if (favorites) {
                    user_favorites = favorites.filter(fav => fav.user._id.toString() === req.user._id.toString())[0];
                    if (!user_favorites) {
                        var err = new Error('You have no favorites!');
                        err.status = 404;
                        return next(err);
                    }
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(user_favorites);
                } else {
                    var err = new Error('There are no favorites');
                    err.status = 404;
                    return next(err);
                }

            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser,
        (req, res, next) => {
            Favorites.find({})
                .populate('user')
                .populate('dishes')
                .then((favorites) => {
                    var user;
                    if (favorites)
                        user = favorites.filter(fav => fav.user._id.toString() === req.user._id.toString())[0];
                    if (!user)
                        user = new Favorites({ user: req.user._id });
                    for (let i of req.body) {
                        if (user.dishes.find((d_id) => {
                            if (d_id._id) {
                                return d_id._id.toString() === i._id.toString();
                            }
                        }))
                            continue;
                        user.dishes.push(i._id);
                    }
                    user.save()
                        .then((favorite) => {
                            Favorites.findById(favorite._id)
                                .populate('user')
                                .populate('dishes')
                                .then((favorite) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(favorite);
                                })
                        })
                        .catch((err) => next(err));

                })
                .catch((err) => next(err));
        })

    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation is not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.find({})
            .populate('user')
            .populate('dishes')
            .then((favorites) => {
                var favToRemove;
                if (favorites) {
                    favToRemove = favorites.filter(fav => fav.user._id.toString() === req.user._id.toString())[0];
                }
                if (favToRemove) {
                    favToRemove.remove()
                        .then((result) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(result);
                        }, (err) => next(err));

                } else {
                    var err = new Error('You do not have any favorites');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

// configuring /:dishId endpoint
favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    // here in get operation we gonna check if the specific dish is present in the favorites or not
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then((favorites) => {
                // checking if the favorites exists or not
                if (!favorites) {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    return res.json({ "exists": false, "favorites": favorites });
                }
                else {
                    // checking if the dishes are present in the favorites or not
                    // if present then the index should be greater than 0 and not -1
                    if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        return res.json({ "exists": false, "favorites": favorites });
                    }
                    else {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        return res.json({ "exists": true, "favorites": favorites });
                    }
                }
            }, (err) => next(err))
            .catch((err) => next(err))
    })
    .post(cors.corsWithOptions, authenticate.verifyUser,
        (req, res, next) => {
            Favorites.find({})
                .populate('user')
                .populate('dishes')
                .then((favorites) => {
                    var user;
                    if (favorites)
                        user = favorites.filter(fav => fav.user._id.toString() === req.user._id.toString())[0];
                    if (!user)
                        user = new Favorites({ user: req.user._id });
                    if (!user.dishes.find((d_id) => {
                        if (d_id._id)
                            return d_id._id.toString() === req.params.dishId.toString();
                    }))
                        user.dishes.push(req.params.dishId);

                    user.save()
                        .then((favorite) => {
                            Favorites.findById(favorite._id)
                                .populate('user')
                                .populate('dishes')
                                .then((favorite) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(favorite);
                                })
                        })
                        .catch((err) => next(err));

                })
                .catch((err) => next(err));
        })

    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation is not supported on /favorites/:dishId');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.find({})
            .populate('user')
            .populate('dishes')
            .then((favorites) => {
                var user;
                if (favorites)
                    user = favorites.filter(fav => fav.user._id.toString() === req.user._id.toString())[0];
                if (user) {
                    user.dishes = user.dishes.filter((dishid) => dishid._id.toString() !== req.params.dishId);
                    user.save()
                        // 
                        .then((result) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(result);
                        }, (err) => next(err))
                    //
                    // .then((favorite) => {
                    //     Favorites.findById(favorite._id)
                    //     .populate('user')
                    //     .populate('dishes')
                    //     .then((favorite) => {
                    //         res.statusCode = 200;
                    //         res.setHeader('Content-Type', 'application/json');
                    //         res.json(favorite);
                    //     })
                    // })

                } else {
                    var err = new Error('you do not have any favorites');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

// exporting favoriteRouter
module.exports = favoriteRouter;