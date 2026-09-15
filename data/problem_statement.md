Stereo Vision Systems in Robotics and other Applications

1. The first thing that needs investigation is Stereo Vision Algorithm Basics. How a typical algorithm works, maybe build one from scratch. Take some images to test it. This does not require much, but may be useful:
- stereo cameras
1. The second step would be going more in depth and learning about different advanced algorithms and specifically how they differ depending on the problem presented. It seems to me that multiple things impact the algorithm selection:
- Resolution of the cameras
- Hardware that will run the algo
- Necessary frequency of inference (ie 2 FPS vs 30 FPS)
- Required precision of depth measurements
- Environment (ie aerial forest view vs glossy industrial floor etc)
1. Also from my understanding there is a bit of difference in problems here. One idea is to get the disparity which allows you to infer the depth to any pixel. But this is not the same as actually getting a 3d map of the environment. Obtaining a 3d map of an environment using stereo vision should also be possible, but it would add another algorithm on top.