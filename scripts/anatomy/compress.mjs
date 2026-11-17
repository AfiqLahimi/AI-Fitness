// Compress the Blender export for the web (meshopt + quantization).
// Usage: node scripts/anatomy/compress.mjs <input.glb> public/models/anatomy.glb
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize, weld, reorder, meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

const [input, output] = process.argv.slice(2);
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(input);
// three.js rewrites node names (spaces → "_", dots removed), so keep the original
// anatomical name in extras; GLTFLoader exposes it as object.userData.anat.
for (const node of doc.getRoot().listNodes()) node.setExtras({ ...node.getExtras(), anat: node.getName() });
await doc.transform(dedup(), weld(), prune(), reorder({ encoder: MeshoptEncoder }), quantize(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
await io.write(output, doc);
console.log("wrote", output);
