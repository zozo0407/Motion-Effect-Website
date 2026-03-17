modelNameText=$1
prompt=$2
imageEffect_file_name=$3
effect_type=$4

rm ~/Downloads/capture.webm

rm ~/Downloads/capture.gif

rm ../capture.webm

rm ../capture.gif

rm ../capture_small.gif

rm palette.png

# 等待服务启动
sleep 20

echo "服务启动成功"

# 打开浏览器进行预览
open http://localhost:3008

sleep 10

# 打开浏览器进行预览、以防服务没有启动
open http://localhost:3008

echo '开始录制'

sleep 40

echo '结束录制'

if [ -f ~/Downloads/capture.webm ]; then
    mv ~/Downloads/capture.webm '../capture.webm'
    echo "✅ WebM文件已移动到 ../capture.webm"
elif [ -f ~/Downloads/capture.gif ]; then
    mv ~/Downloads/capture.gif '../capture.gif'
    echo "✅ GIF文件已移动到 ../capture.gif"
fi

sleep 5

# 生成调色板
ffmpeg -i ../capture.gif -vf "fps=15,scale=600:-1:flags=lanczos,palettegen" -y palette.png
# 用调色板生成GIF
ffmpeg -i ../capture.gif -i palette.png -filter_complex "fps=15,scale=600:-1:flags=lanczos[x];[x][1:v]paletteuse" -y ../capture_small.gif


# # 生成调色板 - 使用更少的颜色
# ffmpeg -i ../capture.webm -vf "fps=8,scale=200:-1:flags=lanczos,palettegen=max_colors=128" -y palette.png
# # 用调色板生成GIF - 添加优化参数
# ffmpeg -i ../capture.webm -i palette.png -filter_complex "fps=8,scale=200:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" -y ../capture.gif

sleep 5

current_dir=$(pwd)

script_file_path="$current_dir/src/core/scriptScene.js"
webm_file_path="$current_dir/../capture_small.gif"

effect_file_path="$current_dir/../3DTemplateEffect.zip"
effect_min_file_path="$current_dir/../3DTemplateEffect_min.zip"
fileLog_file_path="$current_dir/../metrics.json"
# 调用 feishu 上传脚本
cd ../../../../../data/3D/tools
npm install
if [ -n "$imageEffect_file_name" ]; then
    imageEffect_file_path="$current_dir/../$imageEffect_file_name.gif"
    node upload.js --effectType="$effect_type" --doc_id='B4rRd1DInoMDJqxENSAc2Vqnngf' --modelNameText="$modelNameText" --promptText="$prompt" --fileScript="$script_file_path" --imageThreeD="$webm_file_path" --imageEffect="$imageEffect_file_path" --fileEffect="$effect_file_path" --fileEffectMin="$effect_min_file_path" --fileLog="$fileLog_file_path"
else
    node upload.js --effectType="$effect_type" --doc_id='B4rRd1DInoMDJqxENSAc2Vqnngf' --modelNameText="$modelNameText" --promptText="$prompt" --fileScript="$script_file_path" --imageThreeD="$webm_file_path" --fileEffect="$effect_file_path" --fileEffectMin="$effect_min_file_path" --fileLog="$fileLog_file_path"
fi