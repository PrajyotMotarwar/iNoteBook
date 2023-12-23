const express = require('express');
const User = require('../models/Users');
const routes = express.Router();
const { validationResult, body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser')

const JWT_SECRET = "Prajyotisagood$boy"

// Route 1: Create a User using: POST "/api/auth/createuser". No login required
routes.post('/createuser', [
    body('name', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be at least 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ error: 'Sorry, a user with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        });

        const data = {
            user: {
                id: user.id
            }
        };

        const autotoken = jwt.sign(data, JWT_SECRET);
        res.json({ autotoken });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Route 2: Authenticate a User using: POST "/api/auth/login". No login required
routes.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', "Password can't be blank").exists(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Please try to login with correct credentials' });
        }

        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            return res.status(400).json({ error: 'Please try to login with correct credentials' });
        }

        const data = {
            user: {
                id: user.id
            }
        };

        const autotoken = jwt.sign(data, JWT_SECRET);

        res.json({ autotoken });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Route 3: GET loggedin User Details using: POST "/api/auth/getuser". No login required
routes.post('/getuser', fetchuser, async (req, res) => {
    try {
        userID = req.user.id;
        const user = await User.findById(userID).select('-password')
        res.send(user)
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error')
    }
})
module.exports = routes;
