import {HermesClient} from "@pythnetwork/hermes-client";


(async () => {
    const priceServiceConnection = new HermesClient(
        "https://hermes.pyth.network/",
        {}
    );

    // Price Feed Ids
    // https://www.pyth.network/developers/price-feed-ids#stable

    const priceUpdateData = (
        await priceServiceConnection.getLatestPriceUpdates(
            ["0xb2748e718cf3a75b0ca099cb467aea6aa8f7d960b381b3970769b5a2d6be26dc"],
            {encoding: "base64"}
        )
    );

    console.log(priceUpdateData.parsed[0].price);

})();