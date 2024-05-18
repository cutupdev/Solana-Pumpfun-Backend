// routes/users.js
import express from 'express';
import User from '../models/User.js';
import PendingUser from '../models/PendingUser.js';
import crypto from 'crypto'
import joi from 'joi'
import Joi from 'joi';

const router = express.Router();

// @route   POST api/users
// @desc    Resgister user
// @access  Public
router.post('/', (req, res) => {
    // Validate form
    const UserSchema = Joi.object().keys({
        name: Joi.string().required(),
        wallet: Joi.string().required(),
        nonce: Joi.string().required(),
        isLedger: Joi.boolean().optional()
    })
    const inputValidation = UserSchema.validate(body);
    if (inputValidation.error) {
        return res.status(400).json({ error: inputValidation.error.details[0].message })
    }
    const { name, wallet, isLedger } = req.body;
    console.log(req.body.wallet)
    User.findOne({ wallet }).then((existingUser) => {
        if (!existingUser) {
            PendingUser.findOne({ wallet }).then((exisitingPendingUser) => {
                if (!exisitingPendingUser) {
                    const nonce = crypto.randomBytes(8).toString('hex');
                    const newPendingUser = new PendingUser({ name, wallet, nonce });
                    newPendingUser.save().then(user => res.status(200).send(user));
                } else {
                    res.status(400).send({ message: "A user with this wallet already requested." });
                }
            }).catch(err => res.status(500).send(err));
        } else {
            // If a user with the same wallet exists
            res.status(409).send({ message: "A user with this wallet already exists." });
        }
    })

});

// @route   POST api/users/:nonce
// @desc    Confirm and Register user
// @access  Public
router.post('/:nonce', (req, res) => {
    const body = { nonce: req.params.nonce, isLedger: req.body.isLedger };

    // Validate form
    const UserSchema = Joi.object().keys({
        nonce: Joi.string().required(),
        isLedger: Joi.boolean().optional()
    })
    const inputValidation = UserSchema.validate(body);
    if (inputValidation.error) {
        return res.status(400).json({ error: inputValidation.error.details[0].message })
    }

    // nonce  decode!!
    if (!body.isLedger) {
        const signatureUint8 = bs58.decode(body.signature);
        const msgUint8 = new TextEncoder().encode(`${process.env.SIGN_IN_MSG} ${foundNonce.nonce}`);
        const pubKeyUint8 = bs58.decode(body.wallet);
        const isValidSignature = nacl.sign.detached.verify(msgUint8, signatureUint8, pubKeyUint8);

        if (!isValidSignature)
            return res.status(400).json({ error: "Invalid signature" })
    } else {
        const ledgerSerializedTx = JSON.parse(body.signature);
        const signedTx = Transaction.from(Uint8Array.from(ledgerSerializedTx));

        const feePayer = signedTx.feePayer?.toBase58() || "";

        if (feePayer != body.wallet) {
            return res.status(400).json({ error: "Invalid wallet or fee payer" });
        }

        const MEMO_PROGRAM_ID = new PublicKey(
            "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
        );

        const inx = signedTx.instructions.find(
            (ix) => ix.programId.toBase58() == MEMO_PROGRAM_ID.toBase58()
        );

        if (!inx) {
            return res
                .status(503)
                .json({ error: "Memo program couldn't be verified" });
        }

        if (!signedTx.verifySignatures()) {
            return res
                .status(503)
                .json({ error: "Could not verify signatures" });
        }
    }
    console.log(nonce);
    PendingUser.findOne({ nonce }).then((user) => {
        const newUser = new User({
            name: user.name,
            wallet: user.wallet
        })
        newUser.save().then((user) => res.status(200).send(user))
    }).catch(err => res.status(404).send("Your request is expired."))


});


// GET: Fetch all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

export default router;
