import prisma from "../lib/prisma.js ";
import bcrypt from "bcrypt";

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get Users!" });
  }
};

export const getUser = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
    });
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get User!" });
  }
};

export const updateUser = async (req, res) => {
  const id = req.params.id;

  const tokenUserId = req.userId;
  const { password, avatar, ...inputs } = req.body;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }
  let updatePassword = null;

  if (password) {
    updatePassword = await bcrypt.hash(password, 10);
  }

  try {
    const updateUser = await prisma.user.update({
      where: { id },
      data: {
        ...inputs,
        ...(updatePassword && { password: updatePassword }),
        ...(avatar && { avatar }),
      },
    });

    res.status(200).json(updateUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get updateUser!" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;

  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({ message: "User Deleted!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get deleteUser!" });
  }
};

export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserId = req.userId;

  try {
    // Check if the post exists
    const postExists = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (!postExists) {
      return res.status(404).json({ message: "Post not found!" });
    }

    const savePost = await prisma.SavedPost.findUnique({
      where: {
        userId_postId: {
          userId: tokenUserId,
          postId,
        },
      },
    });

    if (savePost) {
      await prisma.SavedPost.delete({
        where: { id: savePost.id },
      });
      res.status(200).json({ message: "Post removed from save list!" });
    } else {
      await prisma.SavedPost.create({
        data: {
          userId: tokenUserId,
          postId,
        },
      });
      res.status(200).json({ message: "Post saved!" });
    }
  } catch (error) {
    console.error("Error saving post:", error);
    res.status(500).json({ message: "Failed to save post!", error: error.message });
  }
};


export const profilePosts =  async(req,res) =>{
    const tokenUserId = req.params.userId;
  
    try {
      const userPosts = await prisma.post.findMany({
        where: { userId: tokenUserId },
      });

      const saved = await prisma.SavedPost.findMany({
        where: { userId: tokenUserId },
        include:{
          post:true,
        }
      });

      const savedPosts = saved.map((item) =>item.post)
      res.status(200).json({userPosts, savedPosts});
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to get Profile Posts!" });
    }
  };
