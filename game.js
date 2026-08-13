// ============================================================
// BOUNCE MALLOW - A Cyberpunk Arcade Platformer
// ============================================================
(function () {
  'use strict';

  var W = 800, H = 800;
  var ARNE = {
    BLACK:'#000000', GRAY:'#9D9D9D', WHITE:'#FFFFFF', RED:'#BE2633',
    PINK:'#E06F8B', BROWN:'#493C2B', DARK_ORAN:'#A46422', ORANGE:'#EB8931',
    YELLOW:'#F7E26B', DARK_TEAL:'#2F484E', GREEN:'#44891A', LIME:'#A3CE27',
    DARK_BLUE:'#1B2632', BLUE:'#005784', LIGHT_BLUE:'#31A2F2', CYAN:'#B2DCEF'
  };

  var GRAVITY=0.48, JUMP_F=-10.5, DJUMP_F=-9, CAM_BASE=2, CAM_MAX=3.8, CAM_ACC=0.00006;
  var PX=160, PSZ=18, CW=22, CH=30, NP=6, NN=75, GY=620, MNY=310, MXY=650, PH=16, SW=14, SH=14;

  var SHAPES=['circle','square','triangle','diamond','cross','hexagon'];
  var CCLR=[ARNE.RED,ARNE.LIGHT_BLUE,ARNE.LIME,ARNE.YELLOW,ARNE.PINK,ARNE.ORANGE];
  var ST={TITLE:0,COUNTDOWN:1,PLAYING:2,GAMEOVER:3,WIN:4};

  var canvas=document.getElementById('gameCanvas');
  var ctx=canvas.getContext('2d');

  var state=ST.TITLE, cam={x:0,spd:CAM_BASE}, player=null;
  var plats=[], spks=[], enms=[], crds=[], stars=[];
  var collCards=[], matchPairs=[], score=0, fCount=0;
  var cdFrames=0, cdNum=3, gStart=0, endX=0, winParts=false;
  var shake={x:0,y:0,int:0}, titleB=0;

  // Particle system (separate from cards)
  var parts=[];

  function clamp(v,lo,hi){return v<lo?lo:v>hi?hi:v}
  function rand(a,b){return a+Math.random()*(b-a)}
  function ri(a,b){return Math.floor(rand(a,b+1))}
  function shuf(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function rov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}

  function spawnP(x,y,col,n,spd){
    for(var i=0;i<n;i++) parts.push({
      x:x,y:y,vx:rand(-spd,spd),vy:rand(-spd*1.5,0.5),
      life:ri(15,45),ml:45,col:col,sz:rand(2,5)
    });
  }

  function updParts(){
    for(var i=parts.length-1;i>=0;i--){
      var p=parts[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;p.life--;
      if(p.life<=0) parts.splice(i,1);
    }
  }

  function initStars(){
    stars=[];
    for(var i=0;i<100;i++) stars.push({
      x:rand(0,endX+500),y:rand(0,H),sz:rand(1,3),
      sp:rand(0.1,0.5),br:rand(0.3,1)
    });
  }

  // ===== LEVEL GENERATION =====
  function genLevel(){
    plats=[];spks=[];enms=[];crds=[];parts=[];
    collCards=[];matchPairs=[];
    var cx=0,cy=GY,prevS=false;
    // Starting platform (safe, wide)
    plats.push({x:0,y:GY,w:350,h:PH});cx=350;
    for(var i=0;i<NN;i++){
      cx+=ri(35,95);
      var pw=ri(70,180);
      cy=clamp(cy+rand(-60,60),MNY,MXY);
      plats.push({x:cx,y:cy,w:pw,h:PH,idx:i});
      // Spikes
      if(i>4&&i>NN-6&&Math.random()<0.20&&!prevS){
        prevS=true;
        var ns=ri(1,Math.max(1,Math.floor(pw/SW)-1));
        var ss=cx+ri(5,pw-ns*SW-5);
        for(var s=0;s<ns;s++) spks.push({x:ss+s*SW,y:cy-SH,w:SW,h:SH});
      }else prevS=false;
      // Enemies
      if(i>8&&i>NN-6&&!prevS&&Math.random()<0.13){
        enms.push({
          x:cx+pw/2,y:cy-14,w:16,h:16,
          pl:cx+10,pr:cx+pw-10,
          spd:rand(1,1.8)*(Math.random()<0.5?1:-1),alive:true
        });
      }
    }
    // End platform
    cx+=60;plats.push({x:cx,y:cy,w:400,h:PH});endX=cx+200;
    // Generate card pairs
    var cd=[];
    for(var p=0;p<NP;p++){
      cd.push({sh:SHAPES[p],cl:CCLR[p],pid:p});
      cd.push({sh:SHAPES[p],cl:CCLR[p],pid:p});
    }
    shuf(cd);
    var sp=Math.floor((NN-12)/cd.length);
    for(var c=0;c<cd.length;c++){
      var ni=6+c*sp;
      if(ni<plats.length-2){
        var pl=plats[ni];
        crds.push({
          x:pl.x+pl.w/2-CW/2,y:pl.y-CH-8,w:CW,h:CH,
          sh:cd[c].sh,cl:cd[c].cl,pid:cd[c].pid,
          col:false,bob:rand(0,Math.PI*2),glow:rand(0,Math.PI*2)
        });
      }
    }
  }

  // ===== PLAYER =====
  function initPlayer(){
    player={
      x:PX,y:GY-PSZ*2-4,vy:0,w:PSZ*2,h:PSZ*2,
      onG:false,jumps:0,maxJ:2,alive:true,blink:0,
      sq:1,st:1,lt:0
    };
  }

  function doJump(){
    if(!player||!player.alive||state!==ST.PLAYING) return;
    if(player.jumps<player.maxJ){
      player.vy=player.jumps===0?JUMP_F:DJUMP_F;
      player.jumps++;player.onG=false;
      player.sq=0.7;player.st=1.3;
      spawnP(player.x+player.w/2,player.y+player.h,
        player.jumps===1?ARNE.CYAN:ARNE.PINK,8,3);
    }
  }

  function updPlayer(){
    if(!player||!player.alive) return;
    player.sq+=(1-player.sq)*0.15;player.st+=(1-player.st)*0.15;
    if(player.lt>0) player.lt--;
    player.vy+=GRAVITY;player.y+=player.vy;
    player.onG=false;
    for(var i=0;i<plats.length;i++){
      var p=plats[i];
      if(p.x+p.w<player.x-10||p.x>player.x+player.w+10) continue;
      if(p.y<player.y-20||p.y>player.y+player.h+20) continue;
      if(player.vy>=0&&player.x+player.w>p.x+4&&player.x<p.x+p.w-4&&
        player.y+player.h>=p.y&&player.y+player.h<=p.y+p.h+player.vy+2){
        player.y=p.y-player.h;
        if(player.vy>4){
          player.sq=1.3;player.st=0.7;player.lt=8;
          spawnP(player.x+player.w/2,player.y+player.h,ARNE.CYAN,5,2);
        }
        player.vy=0;player.onG=true;player.jumps=0;
      }
    }
    if(player.y>H+50) killPlayer();
    player.blink--;
    if(player.blink<-ri(80,180)) player.blink=6;
    if(player.onG&&fCount%4===0) spawnP(player.x,player.y+player.h-2,ARNE.GRAY,1,1);
  }

  function killPlayer(){
    if(!player.alive) return;
    player.alive=false;shake.int=8;
    spawnP(player.x+player.w/2,player.y+player.h/2,ARNE.WHITE,20,5);
    spawnP(player.x+player.w/2,player.y+player.h/2,ARNE.CYAN,15,4);
    setTimeout(function(){if(state===ST.PLAYING) state=ST.GAMEOVER;},800);
  }

  // ===== CAMERA =====
  function updCam(){
    if(state!==ST.PLAYING) return;
    cam.spd=clamp(CAM_BASE+(fCount-gStart)*CAM_ACC,CAM_BASE,CAM_MAX);
    cam.x+=cam.spd;player.x=cam.x+PX;
  }

  // ===== ENEMIES =====
  function updEnms(){
    for(var i=0;i<enms.length;i++){
      var e=enms[i];if(!e.alive) continue;
      e.x+=e.spd;
      if(e.x<=e.pl||e.x+e.w>=e.pr) e.spd*=-1;
    }
  }

  // ===== COLLISIONS =====
  function chkCol(){
    if(!player.alive) return;
    var pb={x:player.x+4,y:player.y+4,w:player.w-8,h:player.h-8};
    for(var i=0;i<spks.length;i++){if(rov(pb,spks[i])){killPlayer();return;}}
    for(var j=0;j<enms.length;j++){if(enms[j].alive&&rov(pb,enms[j])){killPlayer();return;}}
    for(var k=0;k<crds.length;k++){
      var c=crds[k];if(c.col) continue;
      if(rov({x:player.x,y:player.y,w:player.w,h:player.h},c)){
        c.col=true;collCards.push(c);score+=100;
        spawnP(c.x+CW/2,c.y+CH/2,c.cl,15,4);
        spawnP(c.x+CW/2,c.y+CH/2,ARNE.WHITE,8,3);
        chkPair(c.pid);
      }
    }
  }

  function chkPair(pid){
    var cnt=0;
    for(var i=0;i<collCards.length;i++) if(collCards[i].pid===pid) cnt++;
    if(cnt>=2&&matchPairs.indexOf(pid)===-1){
      matchPairs.push(pid);score+=500;shake.int=4;
      spawnP(player.x+player.w/2,player.y,ARNE.YELLOW,25,6);
      if(matchPairs.length>=NP){
        setTimeout(function(){
          if(state===ST.PLAYING){state=ST.WIN;winParts=true;}
        },500);
      }
    }
  }

  // ===== RENDERING =====
  function drawBG(){
    var g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,ARNE.DARK_BLUE);g.addColorStop(0.5,ARNE.DARK_TEAL);
    g.addColorStop(1,ARNE.BLACK);
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // Grid
    var gs=60,gx=-(cam.x*0.3)%gs;
    ctx.strokeStyle=ARNE.BLUE;ctx.globalAlpha=0.12;ctx.lineWidth=1;
    for(var x=gx;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(var y=0;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.globalAlpha=1;
    // Stars
    for(var i=0;i<stars.length;i++){
      var s=stars[i],sx=((s.x-cam.x*s.sp)%(W+100)+W+100)%(W+100);
      ctx.globalAlpha=s.br*(0.7+0.3*Math.sin(fCount*0.05+i));
      ctx.fillStyle=ARNE.CYAN;ctx.fillRect(sx,s.y,s.sz,s.sz);
    }
    ctx.globalAlpha=1;
    // Building silhouettes (2 parallax layers)
    for(var layer=0;layer<2;layer++){
      ctx.globalAlpha=0.25+layer*0.1;
      ctx.fillStyle=layer?ARNE.DARK_BLUE:ARNE.BLACK;
      var par=0.1+layer*0.15,sd=layer*777,bbase=H-80-layer*30;
      for(var bx=-100;bx<W+100;bx+=35+layer*10){
        var bpx=bx+(-(cam.x*par));
        var bh=30+Math.abs(Math.sin((bpx+sd)*0.012))*(120+layer*60);
        var bw=20+Math.abs(Math.cos((bpx+sd)*0.018))*(15+layer*10);
        ctx.fillRect(bpx,bbase-bh,bw,bh+80);
      }
    }
    ctx.globalAlpha=1;
  }

  function drawPlats(){
    for(var i=0;i<plats.length;i++){
      var p=plats[i],sx=p.x-cam.x;
      if(sx+p.w<-20||sx>W+20) continue;
      var g=ctx.createLinearGradient(sx,p.y,sx,p.y+p.h);
      g.addColorStop(0,ARNE.DARK_TEAL);g.addColorStop(1,ARNE.DARK_BLUE);
      ctx.fillStyle=g;ctx.fillRect(sx,p.y,p.w,p.h);
      // Top neon edge
      ctx.shadowColor=ARNE.LIGHT_BLUE;ctx.shadowBlur=6;
      ctx.strokeStyle=ARNE.LIGHT_BLUE;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(sx,p.y);ctx.lineTo(sx+p.w,p.y);
      ctx.stroke();ctx.shadowBlur=0;
      // Surface grid
      ctx.strokeStyle=ARNE.BLUE;ctx.globalAlpha=0.25;ctx.lineWidth=1;
      for(var gx=sx+20;gx<sx+p.w;gx+=20){
        ctx.beginPath();ctx.moveTo(gx,p.y);ctx.lineTo(gx,p.y+p.h);ctx.stroke();
      }
      ctx.globalAlpha=1;
      // Bottom edge
      ctx.strokeStyle=ARNE.DARK_TEAL;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(sx,p.y+p.h);ctx.lineTo(sx+p.w,p.y+p.h);ctx.stroke();
    }
  }

  function drawSpks(){
    for(var i=0;i<spks.length;i++){
      var s=spks[i],sx=s.x-cam.x;
      if(sx+s.w<-10||sx>W+10) continue;
      ctx.fillStyle=ARNE.RED;ctx.shadowColor=ARNE.RED;ctx.shadowBlur=8;
      ctx.beginPath();
      ctx.moveTo(sx,s.y+s.h);ctx.lineTo(sx+s.w/2,s.y);ctx.lineTo(sx+s.w,s.y+s.h);
      ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;
      ctx.fillStyle=ARNE.ORANGE;ctx.globalAlpha=0.5;
      ctx.beginPath();
      ctx.moveTo(sx+3,s.y+s.h-1);ctx.lineTo(sx+s.w/2,s.y+3);
      ctx.lineTo(sx+s.w-3,s.y+s.h-1);ctx.closePath();ctx.fill();
      ctx.globalAlpha=1;
    }
  }

  function drawEnms(){
    for(var i=0;i<enms.length;i++){
      var e=enms[i];if(!e.alive) continue;
      var ex=e.x-cam.x;if(ex+e.w<-20||ex>W+20) continue;
      var pulse=0.7+0.3*Math.sin(fCount*0.1+i),sz=e.w*pulse;
      ctx.save();ctx.translate(ex+e.w/2,e.y+e.h/2);
      ctx.rotate(fCount*0.03);
      ctx.fillStyle=ARNE.RED;ctx.shadowColor=ARNE.RED;ctx.shadowBlur=12;
      ctx.beginPath();
      ctx.moveTo(0,-sz/2);ctx.lineTo(sz/2,0);ctx.lineTo(0,sz/2);
      ctx.lineTo(-sz/2,0);ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;
      ctx.fillStyle=ARNE.YELLOW;ctx.beginPath();
      ctx.arc(0,0,sz/5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=ARNE.BLACK;ctx.beginPath();
      ctx.arc(0,0,sz/9,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  }

  function drawCrds(){
    for(var i=0;i<crds.length;i++){
      var c=crds[i];if(c.col) continue;
      var cx=c.x-cam.x;if(cx+c.w<-20||cx>W+20) continue;
      var bob=Math.sin(fCount*0.06+c.bob)*4,cy=c.y+bob;
      var gp=0.5+0.5*Math.sin(fCount*0.08+c.glow);
      ctx.shadowColor=c.cl;ctx.shadowBlur=8+gp*8;
      ctx.fillStyle=ARNE.DARK_BLUE;ctx.fillRect(cx-1,cy-1,c.w+2,c.h+2);
      ctx.strokeStyle=c.cl;ctx.lineWidth=2;ctx.strokeRect(cx,cy,c.w,c.h);
      ctx.fillStyle=c.cl;ctx.shadowBlur=0;
      drawShp(c.sh,cx+c.w/2,cy+c.h/2+2,c.w/2.5);
    }
  }

  function drawShp(sh,cx,cy,sz){
    ctx.beginPath();
    if(sh==='circle') ctx.arc(cx,cy,sz,0,Math.PI*2);
    else if(sh==='square') ctx.rect(cx-sz,cy-sz,sz*2,sz*2);
    else if(sh==='triangle'){
      ctx.moveTo(cx,cy-sz);ctx.lineTo(cx+sz,cy+sz);ctx.lineTo(cx-sz,cy+sz);ctx.closePath();
    }else if(sh==='diamond'){
      ctx.moveTo(cx,cy-sz);ctx.lineTo(cx+sz,cy);ctx.lineTo(cx,cy+sz);
      ctx.lineTo(cx-sz,cy);ctx.closePath();
    }else if(sh==='cross'){
      var t=sz*0.35;
      ctx.moveTo(cx-t,cy-sz);ctx.lineTo(cx+t,cy-sz);ctx.lineTo(cx+t,cy-t);
      ctx.lineTo(cx+sz,cy-t);ctx.lineTo(cx+sz,cy+t);ctx.lineTo(cx+t,cy+t);
      ctx.lineTo(cx+t,cy+sz);ctx.lineTo(cx-t,cy+sz);ctx.lineTo(cx-t,cy+t);
      ctx.lineTo(cx-sz,cy+t);ctx.lineTo(cx-sz,cy-t);ctx.lineTo(cx-t,cy-t);ctx.closePath();
    }else if(sh==='hexagon'){
      for(var a=0;a<6;a++){
        var ang=Math.PI/3*a-Math.PI/6;
        if(a===0) ctx.moveTo(cx+sz*Math.cos(ang),cy+sz*Math.sin(ang));
        else ctx.lineTo(cx+sz*Math.cos(ang),cy+sz*Math.sin(ang));
      }
      ctx.closePath();
    }
    ctx.fill();
  }

  function drawPlayer(){
    if(!player||!player.alive) return;
    var px=player.x-cam.x,py=player.y;
    ctx.save();
    ctx.translate(px+player.w/2,py+player.h/2);
    ctx.scale(player.sq,player.st);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(2,player.h/2-2,player.w/2+2,4,0,0,Math.PI*2);ctx.fill();
    // Body glow
    ctx.shadowColor=ARNE.WHITE;ctx.shadowBlur=10;
    ctx.fillStyle=ARNE.WHITE;
    var r=player.w/2;
    ctx.beginPath();ctx.ellipse(0,0,r,r*1.1,0,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    // Highlight
    ctx.fillStyle='rgba(178,220,239,0.4)';
    ctx.beginPath();ctx.ellipse(-3,-5,r*0.5,r*0.35,-0.3,0,Math.PI*2);ctx.fill();
    // Eyes
    var ey=-2,esp=5,bh=player.blink>0?1:4,by=player.blink>0?1:0;
    ctx.fillStyle=ARNE.BLACK;
    ctx.beginPath();ctx.ellipse(-esp,ey+by,3,bh,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(esp,ey+by,3,bh,0,0,Math.PI*2);ctx.fill();
    // Smile when pairs matched
    if(matchPairs.length>0&&fCount%60<30){
      ctx.strokeStyle=ARNE.BLACK;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(0,4,4,0.1,Math.PI-0.1);ctx.stroke();
    }
    ctx.restore();
    // Jump trail
    if(!player.onG&&player.vy<0&&fCount%2===0)
      spawnP(player.x+player.w/2,player.y+player.h,ARNE.CYAN,1,1);
  }

  function drawParts(){
    for(var i=0;i<parts.length;i++){
      var p=parts[i],a=p.life/p.ml;
      ctx.globalAlpha=a;ctx.fillStyle=p.col;
      ctx.fillRect(p.x-cam.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
    }
    ctx.globalAlpha=1;
  }

  function drawScan(){
    ctx.fillStyle=ARNE.BLACK;ctx.globalAlpha=0.05;
    for(var y=0;y<H;y+=4) ctx.fillRect(0,y,W,2);
    ctx.globalAlpha=1;
  }

  function drawHUD(){
    // Score
    ctx.fillStyle=ARNE.WHITE;ctx.font='bold 20px "Courier New",monospace';
    ctx.textAlign='left';
    ctx.shadowColor=ARNE.CYAN;ctx.shadowBlur=4;
    ctx.fillText('SCORE: '+score,15,30);ctx.shadowBlur=0;
    // Pairs
    ctx.fillStyle=ARNE.YELLOW;ctx.font='bold 18px "Courier New",monospace';
    ctx.textAlign='center';
    ctx.shadowColor=ARNE.YELLOW;ctx.shadowBlur=4;
    ctx.fillText('PAIRS: '+matchPairs.length+'/'+NP,W/2,30);ctx.shadowBlur=0;
    // Collected cards display
    ctx.textAlign='right';ctx.fillStyle=ARNE.GRAY;
    ctx.font='12px "Courier New",monospace';
    ctx.fillText('CARDS',W-20,14);
    for(var i=0;i<collCards.length;i++){
      var cc=collCards[i];
      var bx=W-30-(i%6)*34,by=22+Math.floor(i/6)*34;
      var pm=matchPairs.indexOf(cc.pid)!==-1;
      if(pm){ctx.shadowColor=ARNE.YELLOW;ctx.shadowBlur=6;}
      ctx.fillStyle=ARNE.DARK_BLUE;ctx.fillRect(bx,by,28,28);
      ctx.strokeStyle=cc.cl;ctx.lineWidth=pm?2:1;ctx.strokeRect(bx,by,28,28);
      ctx.fillStyle=cc.cl;ctx.shadowBlur=0;
      drawShp(cc.sh,bx+14,by+14,7);
      if(pm){
        ctx.fillStyle=ARNE.YELLOW;ctx.font='bold 10px "Courier New",monospace';
        ctx.textAlign='center';ctx.fillText('\u2713',bx+14,by+40);
      }
    }
    // Progress bar at bottom
    var bw=W-40,bh=6,bby=H-25,prog=clamp(cam.x/endX,0,1);
    ctx.fillStyle=ARNE.DARK_TEAL;ctx.fillRect(20,bby,bw,bh);
    var bg=ctx.createLinearGradient(20,0,20+bw*prog,0);
    bg.addColorStop(0,ARNE.BLUE);bg.addColorStop(1,ARNE.LIGHT_BLUE);
    ctx.fillStyle=bg;ctx.fillRect(20,bby,bw*prog,bh);
    // Player dot
    ctx.fillStyle=ARNE.WHITE;ctx.beginPath();
    ctx.arc(20+bw*prog,bby+bh/2,5,0,Math.PI*2);ctx.fill();
    // Card markers on bar
    for(var c=0;c<crds.length;c++){
      var cp=crds[c].x/endX;
      if(cp>0&&cp<1){
        ctx.fillStyle=crds[c].col?ARNE.YELLOW:crds[c].cl;
        ctx.fillRect(20+bw*cp-1,bby-3,3,bh+6);
      }
    }
  }

  // ===== SCREENS =====
  function drawTitle(){
    drawBG();
    titleB+=0.05;var bY=Math.sin(titleB)*8;
    ctx.textAlign='center';ctx.shadowColor=ARNE.CYAN;ctx.shadowBlur=20;
    ctx.fillStyle=ARNE.WHITE;ctx.font='bold 56px "Courier New",monospace';
    ctx.fillText('BOUNCE MALLOW',W/2,200+bY);ctx.shadowBlur=0;
    ctx.fillStyle=ARNE.LIGHT_BLUE;ctx.font='bold 18px "Courier New",monospace';
    ctx.fillText('A Cyberpunk Platformer',W/2,245+bY);
    // Animated marshmallow
    var tmY=350+Math.sin(titleB*1.5)*15;
    ctx.save();ctx.translate(W/2,tmY);ctx.scale(1.5,1.5);
    ctx.shadowColor=ARNE.WHITE;ctx.shadowBlur=15;
    ctx.fillStyle=ARNE.WHITE;
    ctx.beginPath();ctx.ellipse(0,0,PSZ,PSZ*1.1,0,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle=ARNE.BLACK;
    ctx.beginPath();ctx.ellipse(-5,-2,3,4,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(5,-2,3,4,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
    // Controls
    ctx.fillStyle=ARNE.GRAY;ctx.font='16px "Courier New",monospace';
    ctx.fillText('SPACE / ENTER / TAP to Jump',W/2,480);
    ctx.fillText('Double Jump available!',W/2,505);
    ctx.fillStyle=ARNE.YELLOW;ctx.font='14px "Courier New",monospace';
    ctx.fillText('Collect matching card pairs to win!',W/2,550);
    // Start prompt (blinking)
    var pa=0.5+0.5*Math.sin(fCount*0.08);ctx.globalAlpha=pa;
    ctx.fillStyle=ARNE.CYAN;ctx.font='bold 22px "Courier New",monospace';
    ctx.fillText('[ PRESS ANY KEY / TAP TO START ]',W/2,640);
    ctx.globalAlpha=1;drawScan();
  }

  function drawCountdown(){
    drawBG();drawPlats();drawSpks();drawEnms();drawCrds();drawPlayer();
    var num=cdNum,sc=1+(cdFrames%60)/60*0.3,a=1-(cdFrames%60)/60*0.5;
    ctx.textAlign='center';ctx.globalAlpha=a;
    if(num>0){
      ctx.shadowColor=ARNE.CYAN;ctx.shadowBlur=30;ctx.fillStyle=ARNE.WHITE;
      ctx.font='bold '+(Math.floor(80*sc))+'px "Courier New",monospace';
      ctx.fillText(num.toString(),W/2,H/2);ctx.shadowBlur=0;
    }else{
      ctx.shadowColor=ARNE.LIME;ctx.shadowBlur=30;ctx.fillStyle=ARNE.LIME;
      ctx.font='bold 80px "Courier New",monospace';
      ctx.fillText('GO!',W/2,H/2);ctx.shadowBlur=0;
    }
    ctx.globalAlpha=1;drawHUD();drawScan();
  }

  function drawGO(){
    drawBG();drawPlats();drawSpks();drawEnms();drawCrds();drawParts();
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';
    ctx.shadowColor=ARNE.RED;ctx.shadowBlur=20;
    ctx.fillStyle=ARNE.RED;ctx.font='bold 52px "Courier New",monospace';
    ctx.fillText('GAME OVER',W/2,H/2-60);ctx.shadowBlur=0;
    ctx.fillStyle=ARNE.WHITE;ctx.font='bold 24px "Courier New",monospace';
    ctx.fillText('SCORE: '+score,W/2,H/2);
    ctx.fillStyle=ARNE.YELLOW;ctx.font='20px "Courier New",monospace';
    ctx.fillText('Pairs: '+matchPairs.length+'/'+NP,W/2,H/2+40);
    ctx.fillStyle=ARNE.CYAN;ctx.font='16px "Courier New",monospace';
    ctx.fillText('Cards: '+collCards.length+'/'+(NP*2),W/2,H/2+70);
    var pa=0.5+0.5*Math.sin(fCount*0.08);ctx.globalAlpha=pa;
    ctx.fillStyle=ARNE.GRAY;ctx.font='bold 20px "Courier New",monospace';
    ctx.fillText('PRESS ANY KEY / TAP TO RETRY',W/2,H/2+130);
    ctx.globalAlpha=1;drawScan();
  }

  function drawWin(){
    drawBG();drawPlats();drawSpks();drawCrds();drawPlayer();drawParts();
    if(winParts&&fCount%3===0) spawnP(rand(0,W)+cam.x,rand(0,H/2),
      [ARNE.YELLOW,ARNE.CYAN,ARNE.PINK,ARNE.LIME,ARNE.ORANGE][ri(0,4)],3,4);
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';
    ctx.shadowColor=ARNE.LIME;ctx.shadowBlur=25;
    ctx.fillStyle=ARNE.LIME;ctx.font='bold 44px "Courier New",monospace';
    ctx.fillText('ALL PAIRS MATCHED!',W/2,H/2-80);ctx.shadowBlur=0;
    ctx.shadowColor=ARNE.YELLOW;ctx.shadowBlur=15;
    ctx.fillStyle=ARNE.YELLOW;ctx.font='bold 36px "Courier New",monospace';
    ctx.fillText('SCORE: '+score,W/2,H/2-20);ctx.shadowBlur=0;
    ctx.fillStyle=ARNE.CYAN;ctx.font='20px "Courier New",monospace';
    ctx.fillText('Cards: '+(NP*2)+'/'+(NP*2)+'  Pairs: '+NP+'/'+NP,W/2,H/2+30);
    var pa=0.5+0.5*Math.sin(fCount*0.08);ctx.globalAlpha=pa;
    ctx.fillStyle=ARNE.GRAY;ctx.font='bold 20px "Courier New",monospace';
    ctx.fillText('PRESS ANY KEY / TAP TO PLAY AGAIN',W/2,H/2+100);
    ctx.globalAlpha=1;drawScan();
  }

  // ===== RESET =====
  function resetGame(){
    state=ST.COUNTDOWN;cam.x=0;cam.spd=CAM_BASE;
    genLevel();initPlayer();
    parts=[];score=0;cdFrames=0;cdNum=3;
    shake.int=0;winParts=false;initStars();
  }

  // ===== INPUT =====
  function handleInput(){
    if(state===ST.TITLE){resetGame();return;}
    if(state===ST.PLAYING){doJump();return;}
    if(state===ST.GAMEOVER||state===ST.WIN){resetGame();}
  }

  document.addEventListener('keydown',function(e){
    if(e.code==='Space'||e.code==='Enter'||e.key===' '){
      e.preventDefault();
    }
    handleInput();
  });
  canvas.addEventListener('mousedown',function(e){e.preventDefault();handleInput();});
  canvas.addEventListener('touchstart',function(e){e.preventDefault();handleInput();},{passive:false});

  // ===== GAME LOOP =====
  function loop(){
    fCount++;
    if(state===ST.COUNTDOWN){
      cdFrames++;
      if(cdFrames>0&&cdFrames%60===0){
        cdNum--;
        if(cdNum<0){state=ST.PLAYING;gStart=fCount;winParts=false;}
      }
      updPlayer();updEnms();updParts();drawCountdown();
    }else if(state===ST.PLAYING){
      updCam();updPlayer();updEnms();chkCol();updParts();
      if(shake.int>0){
        shake.x=rand(-shake.int,shake.int);
        shake.y=rand(-shake.int,shake.int);
        shake.int*=0.9;if(shake.int<0.5)shake.int=0;
      }else{shake.x=0;shake.y=0;}
      ctx.save();ctx.translate(shake.x,shake.y);
      drawBG();drawPlats();drawSpks();drawEnms();drawCrds();
      drawPlayer();drawParts();drawHUD();
      ctx.restore();drawScan();
    }else if(state===ST.TITLE){
      drawTitle();
    }else if(state===ST.GAMEOVER){
      updParts();
      if(shake.int>0){
        shake.x=rand(-shake.int,shake.int);
        shake.y=rand(-shake.int,shake.int);
        shake.int*=0.9;if(shake.int<0.5)shake.int=0;
      }else{shake.x=0;shake.y=0;}
      ctx.save();ctx.translate(shake.x,shake.y);
      drawGO();ctx.restore();
    }else if(state===ST.WIN){
      updParts();drawWin();
    }
    requestAnimationFrame(loop);
  }

  // ===== INIT =====
  function init(){
    genLevel();initPlayer();initStars();
    loop();
  }

  init();
})();
