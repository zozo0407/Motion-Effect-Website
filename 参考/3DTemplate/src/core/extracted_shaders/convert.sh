rm -rf out/


# 提取shader代码到out文件夹
npm install three
node extractShadersExample.js

echo "===========提取shader代码到out文件夹==========="

sleep 10

# 从out文件夹中找到vert frag文件
vs_file=$(find out/ -name "*.vert")
fs_file=$(find out/ -name "*.frag")

# 将双斜线替换为单斜线
vs_file_clean=$(echo "$vs_file" | sed 's|//|/|g')
echo "vs_file: $vs_file_clean"
# 将双斜线替换为单斜线
fs_file_clean=$(echo "$fs_file" | sed 's|//|/|g')
echo "fs_file: $fs_file_clean"



# 遍历vs_file fs_file 替换shader关键字
for file in $vs_file_clean $fs_file_clean; do
    node replace.js $file
done

echo "===========替换shader关键字==========="

# 转metal
for file in $vs_file_clean $fs_file_clean; do
    dir_path=$(dirname "$file")
    file_name=$(basename "$file")
    output_file="${dir_path}/c_${file_name}"    
    ./crossShader_nonopt --msl $output_file > /dev/null 2>&1
done

echo "===========将vertfrag文件转为metal==========="