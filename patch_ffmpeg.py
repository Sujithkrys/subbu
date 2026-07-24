import re

with open('backend/services/ffmpeg_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update burn_subtitles vf with fontsdir
old_vf = '''    # Use subtitles filter for ASS, or sub for SRT
    if subtitle_path.endswith(".ass"):
        vf = f"ass={subtitle_path}"
    else:'''
new_vf = '''    # Use subtitles filter for ASS, or sub for SRT
    if subtitle_path.endswith(".ass"):
        fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/fonts")).replace("\\\\", "/").replace(":", "\\\\:")
        sub_path_esc = subtitle_path.replace("\\\\", "/").replace(":", "\\\\:")
        vf = f"ass='{sub_path_esc}':fontsdir='{fonts_dir}'"
    else:'''
content = content.replace(old_vf, new_vf)

# 2. Update generate_ass signature
old_sig = '''def generate_ass(
    segments: list[dict],
    output_path: str,
    font_name: str = "Arial",
    font_size: int = 24,
    primary_color: str = "&H00FFFFFF",
    outline_color: str = "&H00000000",
    position: str = "bottom",
) -> str:'''
new_sig = '''def generate_ass(
    segments: list[dict],
    output_path: str,
    font_name: str = "Arial",
    font_size: int = 24,
    primary_color: str = "&H00FFFFFF",
    outline_color: str = "&H00000000",
    position: str = "bottom",
    animation_type: str = None,
) -> str:'''
content = content.replace(old_sig, new_sig)

# 3. Add font mapping in generate_ass
old_alignment = '''    alignment = alignment_map.get(position, "2")

    header = f"""[Script Info]'''
new_alignment = '''    alignment = alignment_map.get(position, "2")
    
    if font_name == "Cinematic Blur":
        font_name = "MontserratBlack"
    elif font_name == "Flicker Shine":
        font_name = "MontserratBold"

    header = f"""[Script Info]'''
content = content.replace(old_alignment, new_alignment)

# 4. Apply animation tags in the loop
old_loop = '''    events = []
    for seg in segments:
        start = _ass_time(seg["start"])
        end = _ass_time(seg["end"])
        text = seg["text"].replace("\\n", "\\\\N")
        events.append(f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(header)
        f.write("\\n".join(events))
        f.write("\\n")'''
new_loop = '''    lines = [header]
    for seg in segments:
        start_ass = _ass_time(seg["start"])
        end_ass = _ass_time(seg["end"])
        text = seg["text"].replace("\\n", "\\\\N")
        
        if animation_type == "cinematic-blur":
            text = f"{{\\\\fad(200,200)\\\\blur15\\\\t(0,300,\\\\blur0.5)}}{text}"
        elif animation_type == "flicker-shine":
            text = f"{{\\\\3c&HFFFF00&\\\\bord6\\\\blur4\\\\1a&H33&\\\\t(0,100,\\\\1a&H00&)\\\\t(100,200,\\\\1a&H44&)\\\\t(200,300,\\\\1a&H00&)}}{text}"
        elif animation_type == "fast-whip":
            text = f"{{\\\\fscx50\\\\fscy50\\\\t(0,150,\\\\fscx120\\\\fscy120)\\\\t(150,300,\\\\fscx100\\\\fscy100)}}{text}"
        elif animation_type == "pop":
            text = f"{{\\\\t(0,150,\\\\fscx110\\\\fscy110)\\\\t(150,300,\\\\fscx100\\\\fscy100)}}{text}"
        elif animation_type == "fade":
            text = f"{{\\\\fad(250,250)}}{text}"

        lines.append(f"Dialogue: 0,{start_ass},{end_ass},Default,,0,0,0,,{text}")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\\n".join(lines))
        f.write("\\n")'''
content = content.replace(old_loop, new_loop)

# Ensure os is imported for os.path
if 'import os' not in content:
    content = 'import os\n' + content

with open('backend/services/ffmpeg_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched ffmpeg_service.py successfully!")
