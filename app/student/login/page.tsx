"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { signIn } from "next-auth/react"
import { Icons } from "@/components/icons"
import Link from "next/link"

const FormSchema = z.object({
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  password: z.string().min(8, { message: "パスワードは8文字以上で入力してください" }),
})

const StudentLoginPage = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setLoading(true)
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (res?.error) {
        toast({
          title: "ログインに失敗しました",
          description: "メールアドレスまたはパスワードが間違っています",
          variant: "destructive",
        })
      } else {
        router.push("/student")
      }
    } catch (error) {
      toast({
        title: "ログインに失敗しました",
        description: "しばらくしてからもう一度お試しください",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container relative h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-zinc-900/80" />
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This library has saved me countless hours of work and helped me deliver stunning designs to my
              clients faster than ever before.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis, Design Lead</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <Icons.logo className="mx-auto h-6 w-6" />
            <h1 className="text-2xl font-semibold tracking-tight">学生ログイン</h1>
            <p className="text-sm text-muted-foreground">メールアドレスとパスワードを入力してください</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email">メールアドレス</label>
              <Input
                id="email"
                placeholder="mail@example.com"
                type="email"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
                disabled={loading}
                required
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="password">パスワード</label>
              <Input
                id="password"
                placeholder="********"
                type="password"
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
                disabled={loading}
                required
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <div className="text-right">
              <Link href="/forgot-password" prefetch={false} className="text-sm text-blue-600 hover:underline">
                パスワードをお忘れですか？
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              ログイン
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default StudentLoginPage
