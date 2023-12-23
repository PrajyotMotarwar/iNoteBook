const express = require('express');
const routes = express.Router();
const fetchuser = require('../middleware/fetchuser');
const Notes = require('../models/Notes');
const { validationResult, body } = require('express-validator');

// Route 1: GET All the Notes using: GET "/api/auth/fetchallnotes". login required
routes.get('/fetchallnotes', fetchuser, async (req, res) => {
    const notes = await Notes.find({ user: req.user.id });
    res.json(notes);
});


// Route 2: Add a new Notes using: POST "/api/auth/addnotes". login required
routes.post('/addnotes', fetchuser, [
    body('title', 'Enter a valid title').isLength({ min: 3 }),
    body('description', 'Description must be at least 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    try {
        const { title, description, tag } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const notes = new Notes({
            title,
            description,
            tag,
            user: req.user.id,
        });

        const savedNotes = await notes.save();
        res.json(savedNotes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});


// Route 3: Updating an existing Note using: PUT "/api/auth/updatenotes/:id". login required
routes.put('/updatenotes/:id', fetchuser, async (req, res) => {
    const { title, description, tag } = req.body;

    const newNote = {};
    if (title) { newNote.title = title };
    if (description) { newNote.description = description };
    if (tag) { newNote.tag = tag };

    let notes = await Notes.findById(req.params.id);
    if (!notes) {
        return res.status(404).json({ error: 'Note not found' });
    }
    if (notes.user && notes.user.toString() !== req.user.id) {
        return res.status(401).json({ error: 'Not allowed' });
    }

    notes = await Notes.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true });

    res.json(notes);
});


// Route 4: Delete an existing Note using: PUT "/api/auth/deletenotes". login required
routes.delete('/deletenotes/:id', fetchuser, async (req, res) => {
    try {
        let notes = await Notes.findById(req.params.id);
        if (!notes) {
            return res.status(404).json({ error: 'Note not found' });
        }
        if (notes.user && notes.user.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not allowed' });
        }

        notes = await Notes.findByIdAndDelete(req.params.id);

        res.json({ 'Success': 'Note has been deleted', notes: notes });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error')
    }
});




module.exports = routes;