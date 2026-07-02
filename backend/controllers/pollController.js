import Poll from "../models/Poll.js";

// Create a new poll
export const createPoll = async (req, res) => {
    try {
        const { question, options, multipleChoice, conversationId } = req.body;
        const newPoll = new Poll({
            creator: req.user.id,
            question,
            options: options.map(opt => ({ text: opt, votes: [] })),
            multipleChoice,
            conversationId
        });
        await newPoll.save();
        res.status(201).json(newPoll);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Get poll by ID
export const getPollById = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: "Poll not found" });
        res.json(poll);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Vote in a poll
export const votePoll = async (req, res) => {
    try {
        const { optionIndex } = req.body;
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: "Poll not found" });

        const userId = req.user.id;
        
        // Remove existing votes from this user if not multiple choice
        if (!poll.multipleChoice) {
            poll.options.forEach(opt => {
                opt.votes = opt.votes.filter(v => v.toString() !== userId);
            });
        }

        // Toggle vote
        const hasVoted = poll.options[optionIndex].votes.includes(userId);
        if (hasVoted) {
            poll.options[optionIndex].votes = poll.options[optionIndex].votes.filter(v => v.toString() !== userId);
        } else {
            poll.options[optionIndex].votes.push(userId);
        }

        await poll.save();
        res.json(poll);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
