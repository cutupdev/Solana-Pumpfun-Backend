import CoinStatus from "../models/CoinsStatus";
import { ResultType } from "../program/web3";
import Coin from "../models/Coin";
import User from "../models/User";


export const setCoinStatus = async (data: ResultType) => {
    console.log("+++++++++++++++++++++++++++++++++++++++")
    const coinId = await Coin.findOne({ token: data.mint }).select('_id');
    const userId = await User.findOne({ wallet: data.owner }).select('_id');
    const newTx = {
        holder: userId?._id,
        holdingStatus: data.swapType,
        amount: data.swapAmount,
        tx:data.tx,
        price: data.reserve2/data.reserve1
    }

    CoinStatus.findOne({ coinId: coinId?._id })
        .then((coinStatus) => {
            coinStatus?.record.push(newTx);
            coinStatus?.save()
        })
        console.log("Update coin when buy or sell", data)
    const updateCoin =await Coin.findOneAndUpdate({ token: data.mint }, { reserveOne: data.reserve1, reserveTwo: data.reserve2 }, { new: true })
    console.log("updat ed coin", updateCoin);
}

