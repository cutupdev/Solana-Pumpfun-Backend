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
        amount: data.swapAmount
    }

    await CoinStatus.findOne({ coinId: coinId?._id })
        .then((coinStatus) => {
            coinStatus?.record.push(newTx);
            coinStatus?.save()
        })
    await Coin.findOneAndUpdate({ token: data.mint }, { reserve1: data.reserve1, reserve2: data.reserve2 }, { new: true })
}