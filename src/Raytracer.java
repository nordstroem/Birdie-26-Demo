import static org.lwjgl.glfw.Callbacks.errorCallbackPrint;
import static org.lwjgl.glfw.GLFW.GLFW_KEY_ESCAPE;
import static org.lwjgl.glfw.GLFW.GLFW_RELEASE;
import static org.lwjgl.glfw.GLFW.GLFW_RESIZABLE;
import static org.lwjgl.glfw.GLFW.GLFW_VISIBLE;
import static org.lwjgl.glfw.GLFW.glfwCreateWindow;
import static org.lwjgl.glfw.GLFW.glfwDefaultWindowHints;
import static org.lwjgl.glfw.GLFW.glfwDestroyWindow;
import static org.lwjgl.glfw.GLFW.glfwGetPrimaryMonitor;
import static org.lwjgl.glfw.GLFW.glfwGetVideoMode;
import static org.lwjgl.glfw.GLFW.glfwInit;
import static org.lwjgl.glfw.GLFW.glfwMakeContextCurrent;
import static org.lwjgl.glfw.GLFW.glfwPollEvents;
import static org.lwjgl.glfw.GLFW.glfwSetErrorCallback;
import static org.lwjgl.glfw.GLFW.glfwSetKeyCallback;
import static org.lwjgl.glfw.GLFW.glfwSetWindowPos;
import static org.lwjgl.glfw.GLFW.glfwSetWindowShouldClose;
import static org.lwjgl.glfw.GLFW.glfwShowWindow;
import static org.lwjgl.glfw.GLFW.glfwSwapBuffers;
import static org.lwjgl.glfw.GLFW.glfwSwapInterval;
import static org.lwjgl.glfw.GLFW.glfwTerminate;
import static org.lwjgl.glfw.GLFW.glfwWindowHint;
import static org.lwjgl.glfw.GLFW.glfwWindowShouldClose;
import static org.lwjgl.opengl.GL11.GL_COLOR_BUFFER_BIT;
import static org.lwjgl.opengl.GL11.GL_DEPTH_BUFFER_BIT;
import static org.lwjgl.opengl.GL11.GL_FALSE;
import static org.lwjgl.opengl.GL11.GL_TEXTURE_2D;
import static org.lwjgl.opengl.GL11.GL_TRUE;
import static org.lwjgl.opengl.GL11.glBindTexture;
import static org.lwjgl.opengl.GL11.glClear;
import static org.lwjgl.opengl.GL11.glClearColor;
import static org.lwjgl.opengl.GL11.glViewport;
import static org.lwjgl.opengl.GL13.GL_TEXTURE0;
import static org.lwjgl.opengl.GL13.glActiveTexture;
import static org.lwjgl.opengl.GL20.glGetUniformLocation;
import static org.lwjgl.opengl.GL30.GL_FRAMEBUFFER;
import static org.lwjgl.opengl.GL30.glBindFramebuffer;
import static org.lwjgl.system.MemoryUtil.NULL;

import java.nio.ByteBuffer;
import java.nio.FloatBuffer;

import org.lwjgl.BufferUtils;
import org.lwjgl.glfw.GLFWErrorCallback;
import org.lwjgl.glfw.GLFWKeyCallback;
import org.lwjgl.glfw.GLFWvidmode;
import org.lwjgl.opengl.GL11;
import org.lwjgl.opengl.GL15;
import org.lwjgl.opengl.GL20;
import org.lwjgl.opengl.GL30;
import org.lwjgl.opengl.GL43;
import org.lwjgl.opengl.GLContext;


public class Raytracer {

	// We need to strongly reference callback instances.
	private GLFWErrorCallback errorCallback;
	private GLFWKeyCallback keyCallback;

	// The window handle
	private long window;
	private int vertexCount;
	private int vaoId;
	private int vboId;
	
	private GLSLProgram shader;
	private GLSLProgram textureShader;
	private long tick;
	private Texture noise;
	private FBO fbo;
	private int windowWidth = 1280;
	private int windowHeight = 720;
	private int fboWidth = 1280;
	private int fboHeight = 720;
	
	public void run() {
		try {
			init();
			loop();

			// Release window and window callbacks
			glfwDestroyWindow(window);
			keyCallback.release();
		} catch(Exception e){
			e.printStackTrace();
		} finally {

			// Free shader
			shader.free();
			textureShader.free();
			noise.free();
			fbo.free();
			
			// Delete the VBO
			GL15.glBindBuffer(GL15.GL_ARRAY_BUFFER, 0);
			GL15.glDeleteBuffers(vboId);
			
			// Delete the VAO
			GL30.glBindVertexArray(0);
			GL30.glDeleteVertexArrays(vaoId);

			// Terminate GLFW and release the GLFWerrorfun
			glfwTerminate();
			errorCallback.release();
		}
	}

	private void init() {
		// Setup an error callback. The default implementation
		// will print the error message in System.err.
		glfwSetErrorCallback(errorCallback = errorCallbackPrint(System.err));

		// Initialize GLFW. Most GLFW functions will not work before doing this.
		if (glfwInit() != GL11.GL_TRUE)
			throw new IllegalStateException("Unable to initialize GLFW");

		// Configure our window
		glfwDefaultWindowHints(); // optional, the current window hints are already the default
		glfwWindowHint(GLFW_VISIBLE, GL_FALSE); // the window will stay hidden after creation
		glfwWindowHint(GLFW_RESIZABLE, GL_TRUE); // the window will be resizable


		
		// Create the window
		window = glfwCreateWindow(windowWidth, windowHeight, "Raytracer", NULL, NULL);
		if (window == NULL)
			throw new RuntimeException("Failed to create the GLFW window");

		// Setup a key callback. It will be called every time a key is pressed, repeated or released.
		glfwSetKeyCallback(window, keyCallback = new GLFWKeyCallback() {
			@Override
			public void invoke(long window, int key, int scancode, int action, int mods) {
				if (key == GLFW_KEY_ESCAPE && action == GLFW_RELEASE)
					glfwSetWindowShouldClose(window, GL_TRUE); // We will detect this in our rendering loop
			}
		});

		// Get the resolution of the primary monitor
		ByteBuffer vidmode = glfwGetVideoMode(glfwGetPrimaryMonitor());
		// Center our window
		glfwSetWindowPos(window, (GLFWvidmode.width(vidmode) - windowWidth) / 2, (GLFWvidmode.height(vidmode) - windowHeight) / 2);

		// Make the OpenGL context current
		glfwMakeContextCurrent(window);
		// Enable v-sync
		glfwSwapInterval(0); //TODO 0

		// Make the window visible
		glfwShowWindow(window);

		GLContext.createFromCurrent();
		System.out.println("Error: " + GL11.glGetError());
		setupQuad();
		shader = new GLSLProgram("shaders/vertex.vert", "shaders/fragment.frag");
		textureShader = new GLSLProgram("shaders/vertex.vert", "shaders/textureRender.frag");


		tick = 0;
		
		noise = Texture.getTexture("noise.png");

		fbo = new FBO(fboWidth, fboHeight, true);
	}

	public void setupQuad() {
		// OpenGL expects vertices to be defined counter clockwise by default
		float[] vertices = {
				// Left bottom triangle
				-1f, 1f, 0f, -1, -1f, 0f, 1f, -1f, 0f,
				// Right top triangle
				1f, -1, 0f, 1, 1, 0f, -1, 1, 0f };
		// Sending data to OpenGL requires the usage of (flipped) byte buffers
		FloatBuffer verticesBuffer = BufferUtils.createFloatBuffer(vertices.length);
		verticesBuffer.put(vertices);
		verticesBuffer.flip();

		vertexCount = 6;

		vaoId = GL30.glGenVertexArrays();
		GL30.glBindVertexArray(vaoId);
		GL20.glEnableVertexAttribArray(0);
		
		vboId = GL15.glGenBuffers();
		GL15.glBindBuffer(GL15.GL_ARRAY_BUFFER, vboId);
		GL15.glBufferData(GL15.GL_ARRAY_BUFFER, verticesBuffer, GL15.GL_STATIC_DRAW);
		GL20.glVertexAttribPointer(0, 3, GL11.GL_FLOAT, false, 0, 0);
		GL15.glBindBuffer(GL15.GL_ARRAY_BUFFER, 0);
		
		GL30.glBindVertexArray(0);
	}

	private void loop() {
		// This line is critical for LWJGL's interoperation with GLFW's
		// OpenGL context, or any context that is managed externally.
		// LWJGL detects the context that is current in the current thread,
		// creates the ContextCapabilities instance and makes the OpenGL
		// bindings available for use.

		// Set the clear color
		glClearColor(0.0f, 0.0f, 0.0f, 0.0f);

		int tickID = glGetUniformLocation(shader.getProgramID(), "tick");
		int tickLoc = glGetUniformLocation(textureShader.getProgramID(), "tick");
		
		// Run the rendering loop until the user has attempted to close
		// the window or has pressed the ESCAPE key.
		long start = System.nanoTime();

		while (glfwWindowShouldClose(window) == GL_FALSE) {
			long t0 = System.nanoTime();
			float elapsed = (float)((System.nanoTime() - start) / 1E9);
			
			float debugStart = 30;
			//Render to FBO
			glActiveTexture(GL_TEXTURE0);
			glBindTexture(GL_TEXTURE_2D, noise.textureID);
			glBindFramebuffer(GL_FRAMEBUFFER, fbo.fbo);
			glViewport(0,0,fbo.width,fbo.height); // Render on the whole framebuffer, complete from the lower left corner to the upper right
			glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT); // clear the framebuffer
			shader.enable();
			GL20.glUniform1f(tickID, elapsed + debugStart); 
			GL30.glBindVertexArray(vaoId);
			GL11.glDrawArrays(GL11.GL_TRIANGLES, 0, vertexCount);
			GL30.glBindVertexArray(0);
			shader.disable();
			
			//Render the texture
			glActiveTexture(GL_TEXTURE0);
			glBindTexture(GL_TEXTURE_2D, fbo.textureID);
			glBindFramebuffer(GL_FRAMEBUFFER, 0);
			glViewport(0,0, windowWidth, windowHeight); // Render on the whole framebuffer, complete from the lower left corner to the upper right
			textureShader.enable();
			GL20.glUniform1f(tickID, elapsed + debugStart); 
			GL30.glBindVertexArray(vaoId);
			GL11.glDrawArrays(GL11.GL_TRIANGLES, 0, vertexCount);
			GL30.glBindVertexArray(0);
			textureShader.disable();
			glBindTexture(GL_TEXTURE_2D, 0);
			
			glfwSwapBuffers(window); // swap the color buffers

			// Poll for window events. The key callback above will only be
			// invoked during this call.
			glfwPollEvents();
			tick++;
			System.out.println(1000 / ((System.nanoTime() - t0) / 1E6));
			//System.out.println(tick/120.0);
		}
		glBindTexture(GL_TEXTURE_2D, 0);
	}

	public static void main(String[] args) {
		new Raytracer().run();
	}

}