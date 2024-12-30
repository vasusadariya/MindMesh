import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Hono } from 'hono'
import { verify } from 'hono/jwt';

export const blogRouter = new Hono<{
  Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
  },
  Variables: {
    userId: string;
    id: number;
    id1:string;
  }
}>();


blogRouter.use("/*",async (c,next)=>{
    const authHeader = c.req.header("authorization")|| "";
    try {
        const user = await verify(authHeader,c.env.JWT_SECRET);
    if(user){
        c.set('userId',user.id);
        await  next();
    }else {
         c.status(403);
         return c.json({ error: "you are not logged in" });
    }
    } catch (error) {
        c.status(403);
        return c.json({ error: "you are not logged in" });
    }
    
})
blogRouter.post('/', async (c) => {
	const userId = c.get('userId');
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const post = await prisma.post.create({
		data: {
			title: body.title,
			content: body.content,
			authorId: userId
		}
	});
	return c.json({
		id: post.id 
	});
});

blogRouter.put('/blog', async (c) => {
	const userId = c.get('userId');
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	prisma.post.update({
		where: {
			id: body.id,
			authorId: userId
		},
		data: {
			title: body.title,
			content: body.content
		} 
	});

	return c.text('updated post');
});

blogRouter.get('/bulk', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	
	const posts = await prisma.post.findMany({});

	return c.json({
        posts
    })
});
blogRouter.get('/:id', async (c) => {
	const id1 = c.req.param("id");
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	
	const post = await prisma.post.findUnique({
		where: {
			id:Number(id1),
		}
	});

	return c.json(post);
});

