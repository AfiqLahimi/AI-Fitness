import bpy, re, sys
side=re.compile(r'\.(l|r)$')
def objs(c): return [o for o in bpy.data.collections[c].all_objects if o.type=='MESH']
mus=[o for o in objs('4: Muscular system') if side.search(o.name) and not re.search(r'bursa|sheath|retinacul|fascia|aponeuros|ligament',o.name,re.I)]
bon=[o for o in objs('1: Skeletal system') if (side.search(o.name) or not re.search(r'\.[a-z0-9]+$',o.name)) and len(o.data.vertices)>40]
bpy.ops.object.select_all(action='DESELECT')
for group,ratio in ((mus,0.3),(bon,0.12)):
    for o in group:
        o.hide_set(False); o.hide_viewport=False; o.hide_render=False
        o.data.materials.clear()
        # Smooth shading so muscles look organic rather than faceted.
        o.data.polygons.foreach_set('use_smooth', [True]*len(o.data.polygons))
        if len(o.data.vertices)>400:
            m=o.modifiers.new('dec','DECIMATE'); m.ratio=ratio
        o.select_set(True)
for o in bon: o.name = "BONE_" + o.name
out=sys.argv[sys.argv.index('--')+1]
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True,
  export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
  export_draco_position_quantization=13, export_draco_normal_quantization=8,
  export_texcoords=False, export_materials='NONE', export_yup=True, export_extras=False)
print("EXPORTED", len(mus), len(bon))
