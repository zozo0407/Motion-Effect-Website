- 针对滑竿
  - 滑竿是一种规范化的从上层设置scriptScene类内部参数的方式，滑竿必须是数值类型的，每个滑竿会对应一个scriptScene类的内部参数，称为滑竿参数。
  - 滑竿参数的初始化需要实现在函数setupSliders()内，滑竿信息保存在sliders变量里。sliders是一个map对象，其中key是滑竿的名称（字符串格式），value是一个对象，包括最大值、最小值、当前值三个键值对，其值均为数值类型，分别对应滑竿的最大值、最小值和当前取值。示例代码（其中，effects_adjust_intensity是滑竿名，它的最大值为1，最小值为0，初始值为0.5）：
```
setupSliders(){
  this.sliders["effects_adjust_intensity"] = {
    max: 1,
    min: 0,
    value: 0.5,
  };
}
```
  - 滑竿参数的更新会通过`onevent`函数进行，必须确保对应滑竿的滑竿参数在滑竿更新后，能够及时生效。例如可以在Tween动画的`onUpdate`函数使用滑竿参数，或者将滑竿参数绑定到shader里。
  - 滑竿的名称只能在以下字符串中选取，并且不可以重复。选取名称时，应于滑竿具体的作用相符，如果没有符合某个特定作用的滑竿名称，可以随意选取一个：
```

effects_adjust_filter
effects_adjust_texture
effects_adjust_noise
effects_adjust_sharpen
effects_adjust_soft
effects_adjust_luminance
effects_adjust_blur
effects_adjust_distortion
effects_adjust_range
effects_adjust_horizontal_chromatic
effects_adjust_vertical_chromatic
effects_adjust_horizontal_shift
effects_adjust_vertical_shift
effects_adjust_number
effects_adjust_size
effects_adjust_intensity
effects_adjust_rotate
effects_adjust_color
effects_adjust_background_animation
effects_adjust_sticker
```
  - 滑竿的更新需要在updateSliders函数内实现，这里需要从sliders里获取具体的滑竿值，赋给对应的成员变量。在scriptScene类的其他函数内，通过使用对应的成员变量使滑竿起作用。
  - 应至少应该添加一个滑竿。如果用户显式指定了滑竿，则按照用户的要求设置滑竿，不需要额外添加。如果用户没有显式指定滑竿，则添加一个速度滑竿，默认值为0.5，取值范围0-1，用于调整动画的播放速度，取值为0.5时，动画播放速度为正常速度。
  - 在setupSliders函数之前，需要统一在备注里注明所有滑竿的信息。以`//===滑竿begin===`开始，以`//===滑竿end===`结尾，中间每一行代表一个滑竿，每行均已`//`开始，依次记录 滑竿名称、滑竿最大值、滑竿最小值、滑竿默认值 ，中间以 `,` 分割。示例：
```
//===滑竿begin===
// effects_adjust_intensity, 1, 0, 0.5
//===滑竿end===
```
