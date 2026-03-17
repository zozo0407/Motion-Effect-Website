import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, spring, Video, Img, staticFile, Sequence } from 'remotion';
import React from 'react';

const Title: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const translateY = interpolate(frame, [0, 30], [50, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
      <h1 style={{ 
          fontSize: 100, 
          transform: `scale(${scale})`, 
          margin: 0, 
          color: 'white',
          textShadow: '0 0 20px rgba(0,0,0,0.5)',
          fontWeight: 900
      }}>
        {title}
      </h1>
      <h2 style={{ 
          fontSize: 50, 
          marginTop: 20, 
          color: '#eee', 
          opacity, 
          transform: `translateY(${translateY}px)`,
          textShadow: '0 0 10px rgba(0,0,0,0.5)'
      }}>
        {subtitle}
      </h2>
    </AbsoluteFill>
  );
};

const BackgroundVideo: React.FC<{ src: string }> = ({ src }) => {
    return (
        <AbsoluteFill>
            <Video src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
            <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
        </AbsoluteFill>
    )
}

const KenBurnsImage: React.FC<{ src: string, text: string }> = ({ src, text }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    
    const scale = interpolate(frame, [0, durationInFrames], [1, 1.2]);
    const opacity = interpolate(frame, [0, 20, durationInFrames - 20, durationInFrames], [0, 1, 1, 0]);
    const textY = interpolate(frame, [0, 30], [100, 0], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#111' }}>
            <Img 
                src={src} 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    transform: `scale(${scale})`,
                    opacity: 0.6
                }} 
            />
             <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                <h2 style={{ 
                    fontSize: 80, 
                    color: 'white', 
                    opacity,
                    transform: `translateY(${textY}px)`,
                    textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '20px 40px',
                    borderRadius: 20,
                    backdropFilter: 'blur(5px)'
                }}>
                    {text}
                </h2>
             </AbsoluteFill>
        </AbsoluteFill>
    )
}

const TechStack: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    const techs = ["WebGL", "Three.js", "React", "Remotion"];
    
    return (
        <AbsoluteFill style={{ backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ color: '#fff', fontSize: 60, marginBottom: 50 }}>技术栈</h1>
            <div style={{ display: 'flex', gap: 40 }}>
                {techs.map((t, i) => {
                    const delay = i * 10;
                    const scale = spring({ frame: frame - delay, fps, config: { damping: 12 } });
                    const opacity = interpolate(frame - delay, [0, 20], [0, 1]);
                    
                    return (
                        <div key={t} style={{ 
                            transform: `scale(${scale})`, 
                            opacity,
                            background: 'linear-gradient(135deg, #6e8efb, #a777e3)',
                            padding: '20px 40px',
                            borderRadius: 15,
                            color: 'white',
                            fontSize: 40,
                            fontWeight: 'bold',
                            boxShadow: '0 10px 30px rgba(110, 142, 251, 0.4)'
                        }}>
                            {t}
                        </div>
                    )
                })}
            </div>
        </AbsoluteFill>
    );
}

const Outro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    const scale = 1 + Math.sin(frame / 10) * 0.05;
    
    return (
        <AbsoluteFill style={{ 
            backgroundColor: '#000', 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundImage: `url(${staticFile('Sample3.jpg')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}>
            <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} />
            <div style={{ zIndex: 1, textAlign: 'center' }}>
                <h1 style={{ 
                    fontSize: 100, 
                    color: '#fff', 
                    marginBottom: 20,
                    transform: `scale(${scale})`,
                    textShadow: '0 0 30px rgba(255,255,255,0.5)'
                }}>
                    立即探索
                </h1>
                <h2 style={{ color: '#aaa', fontSize: 40 }}>CupCut Creative Workbench</h2>
            </div>
        </AbsoluteFill>
    )
}

export const MyComposition = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
        <Sequence from={0} durationInFrames={300}>
            <BackgroundVideo src={staticFile('sample1.mp4')} />
            <Title title="CupCut" subtitle="创意编程工作台" />
        </Sequence>
        
        <Sequence from={300} durationInFrames={150}>
            <KenBurnsImage src={staticFile('Sample1.jpg')} text="交互式粒子系统" />
        </Sequence>
        
        <Sequence from={450} durationInFrames={150}>
            <KenBurnsImage src={staticFile('Sample2.jpg')} text="3D 图形渲染" />
        </Sequence>

        <Sequence from={600} durationInFrames={150}>
            <TechStack />
        </Sequence>

        <Sequence from={750} durationInFrames={150}>
            <Outro />
        </Sequence>
    </AbsoluteFill>
  );
};
