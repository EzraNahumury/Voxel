// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {VoxelGame} from "../src/VoxelGame.sol";

/// @notice Deploy script for VoxelGame.
/// @dev Broadcast is driven by the --private-key flag passed on the CLI, e.g.
///      forge script script/VoxelGame.s.sol:VoxelGameScript \
///        --rpc-url $CELO_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
contract VoxelGameScript is Script {
    function run() external returns (VoxelGame voxel) {
        vm.startBroadcast();
        voxel = new VoxelGame();
        vm.stopBroadcast();

        console.log("VoxelGame deployed at:", address(voxel));
        console.log("Owner:", voxel.owner());
        console.log("voxelPerCelo:", voxel.voxelPerCelo());
    }
}
