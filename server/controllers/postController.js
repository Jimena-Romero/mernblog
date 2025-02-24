const Post = require('../models/Post');
const multer = require('multer');

// Configuración de multer para manejar la subida de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage }).single('thumbnail');

// Crear un nuevo post
const createPost = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error subiendo la imagen', err });
        }

        try {
            const { title, category, description } = req.body;

            // Verificar que req.user contiene el id del usuario
            console.log('Usuario autenticado:', req.user);  // Verifica si tiene el campo id

            if (!req.user || !req.user.userId) {
                return res.status(400).json({ message: 'Usuario no autenticado' });
            }

            const newPost = new Post({
                title,
                category,
                description,
                thumbnail: req.file ? req.file.filename : null,
                creator: req.user.userId,  // Asegúrate de que req.user.userId esté presente
            });

            const savedPost = await newPost.save();

            res.status(201).json({
                id: savedPost._id,
                thumbnail: `uploads/${savedPost.thumbnail}`,
                category: savedPost.category,
                title: savedPost.title,
                description: savedPost.description,
                creator: savedPost.creator,
            });
        } catch (error) {
            console.error('Error al guardar el post:', error);
            res.status(500).json({ message: 'Error al crear el post' });
        }
    });
};

// Obtener los posteos del usuario autenticado
// Obtener los posteos de un usuario específico
const getMyPosts = async (req, res) => {
    try {
        const userId = req.user.id;  // Obtener el ID del usuario autenticado

        if (!userId) {
            return res.status(400).json({ message: 'Usuario no autenticado' });
        }

        console.log('Buscando posts para el usuario con ID:', userId);

        // Filtrar los posteos por el creator (usuario)
        const posts = await Post.find({ creator: userId }).populate('creator'); // Utiliza populate si deseas obtener detalles del usuario

        res.status(200).json(posts);  // Devuelve los posteos filtrados
    } catch (error) {
        console.error('Error al obtener los posteos:', error);
        res.status(500).json({ message: 'Error al obtener los posteos' });
    }
};


const getPostById = async (req, res) => {
    try {
        console.log('Post ID:', req.params.id); // Log para verificar el id
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching post', error });
    }
};

const getPostWithCreator = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('creator', 'username email');
        if (!post) {
            return res.status(404).json({ message: 'Post no encontrado' });
        }
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el post con datos del creador', error });
    }
};

const updatePost = async (req, res) => {
    const postId = req.params.id;
    const { title, description, category, thumbnail } = req.body;

    // Verificar que el postId y los datos necesarios estén presentes
    if (!postId) {
        return res.status(400).json({ message: 'ID de post no proporcionado' });
    }

    if (!title || !description || !category) {
        return res.status(400).json({ message: 'Título, descripción o categoría faltante' });
    }

    try {
        // Buscar el post por ID
        const post = await Post.findById(postId);
        
        if (!post) {
            return res.status(404).json({ message: 'Post no encontrado' });
        }

        // Actualizar los valores
        post.title = title;
        post.description = description;  // Asegúrate de actualizar el contenido
        post.category = category;
        post.thumbnail = thumbnail;

        // Guardar el post actualizado
        await post.save();

        return res.status(200).json(post);
    } catch (error) {
        console.error('Error al actualizar el post:', error);
        return res.status(500).json({ message: 'Error al actualizar el post' });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find();  // Recupera todos los posteos
        res.status(200).json(posts);  // Devuelve los posteos como una respuesta JSON
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los posteos', error });
    }
};


module.exports = { createPost, getMyPosts, getPostById, updatePost, getAllPosts, getPostWithCreator};

