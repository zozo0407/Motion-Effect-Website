modelNameText=$1
prompt=$2
video_file_name=$3
effect_type=$4

current_dir=$(pwd)
script_file_path="$current_dir/src/core/scriptScene.js"
imageEffect_file_path="$current_dir/../$video_file_name.gif"
webm_file_path="$current_dir/../capture.gif"
effect_file_path="$current_dir/../3DTemplateEffect.zip"
effect_min_file_path="$current_dir/../3DTemplateEffect_min.zip"
fileLog_file_path="$current_dir/../metrics.json"

# 调用 feishu 上传脚本
cd ../../../../../data/3D/tools
npm install
node upload.js --effectType="$effect_type" --doc_id='B4rRd1DInoMDJqxENSAc2Vqnngf' --modelNameText="$modelNameText" --promptText="$prompt" --fileScript="$script_file_path" --imageThreeD="$webm_file_path" --imageEffect="$imageEffect_file_path" --fileEffect="$effect_file_path" --fileEffectMin="$effect_min_file_path" --fileLog="$fileLog_file_path"